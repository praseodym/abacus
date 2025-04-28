#![no_main]

use std::sync::OnceLock;

use abacus::apportionment::{
    ApportionmentError, get_total_seats_from_apportionment_result, seat_assignment,
};
use abacus_fuzz::FuzzedElectionSummary;
use libfuzzer_sys::fuzz_target;

use jni::{
    InitArgsBuilder, JNIVersion, JavaVM,
    objects::{JLongArray, JValue},
};

static JVM: OnceLock<JavaVM> = OnceLock::new();

#[derive(Debug)]
enum OSV2020Result {
    Allocated(Vec<u32>),
    Conflict,
}

fn osv2020_apportionment(
    seats: i64,
    pg_candidates: &[i64],
    votes: &[i64],
) -> Result<OSV2020Result, jni::errors::StartJvmError> {
    // Attach the current thread to call into Java — see extra options in
    // "Attaching Native Threads" section.
    //
    // This method returns the guard that will detach the current thread when dropped,
    // also freeing any local references created in it
    let mut env = JVM.get().unwrap().attach_current_thread()?;

    // Prepare arguments
    let java_seats = JValue::from(seats);
    let java_pg_candidates = env.new_long_array(pg_candidates.len() as i32)?;
    env.set_long_array_region(&java_pg_candidates, 0, pg_candidates)?;
    let java_votes = env.new_long_array(votes.len() as i32)?;
    env.set_long_array_region(&java_votes, 0, &votes)?;

    // Call apportionment method
    let val = env.call_static_method(
        "nl/kiesraad/osv2020_apportionment_wrapper/Main",
        "apportionment",
        "(J[J[J)[J",
        &[
            java_seats,
            (&java_pg_candidates).into(),
            (&java_votes).into(),
        ],
    )?;

    // Convert JValue to JObject and then to JLongArray
    let result_array = JLongArray::from(val.l()?);

    // Get the array length
    let length = env.get_array_length(&result_array)?;

    // Create a Rust vector to hold the Java long array elements
    let mut rust_array = vec![0_i64; length as usize];

    // Copy the Java long array elements into our Rust vector
    env.get_long_array_region(&result_array, 0, &mut rust_array)?;

    // Print the seat allocation
    println!("Seat allocation: {:?}", rust_array);

    if rust_array.len() == 1 && rust_array[0] == -1 {
        return Ok(OSV2020Result::Conflict);
    }

    let u32_array = rust_array.iter().map(|&x| x as u32).collect::<Vec<u32>>();

    Ok(OSV2020Result::Allocated(u32_array))
}

fuzz_target!(
    init: {
        // Build the VM properties
        let jvm_args = InitArgsBuilder::new()
            // Pass the JNI API version (default is 8)
            .version(JNIVersion::V8)
            // You can additionally pass any JVM options (standard, like a system property, or VM-specific).
            // Here we enable some extra JNI checks useful during development
            .option("-Xcheck:jni")
            .option("-Xmx1024m")
            .option("-Xss1024k")
            // Class path is loaded from the environment variable CLASSPATH
            .option(format!("-Djava.class.path={}", std::env::var("CLASSPATH").unwrap()))
            .build()
            .unwrap();

        // Create a new VM
        let jvm = JavaVM::new(jvm_args).unwrap();
        JVM.set(jvm).unwrap();
    },
    |data: FuzzedElectionSummary| {
        println!("FuzzedElectionSummary: {:#?}", data.election_summary);

        let pg_candidates: Vec<i64> = data.election_summary.political_group_votes.iter().map(|x| x.candidate_votes.len() as i64).collect();
        let votes: Vec<i64> = data.votes.iter().flat_map(|x| x).map(|x| *x as i64).collect();
        let osv2020_result = osv2020_apportionment(data.seats.into(), &pg_candidates, &votes).unwrap();

        let abacus_result = seat_assignment(data.seats, &data.election_summary);

        println!("OSV2020 result: {:?}", osv2020_result);
        println!("Abacus result:  {:#?}", abacus_result);

        match abacus_result {
            Ok(alloc) => {
                let abacus_seats = get_total_seats_from_apportionment_result(&alloc);

                match osv2020_result {
                    OSV2020Result::Allocated(osv2020_seats) => {
                        println!("OSV2020 seats: {:?}", osv2020_seats);
                        println!("Abacus seats:  {:?}", abacus_seats);
                        assert!(
                            abacus_seats.iter().eq(osv2020_seats.iter()),
                            "OSV2020 implementation did not produce the same results:\nOSV2020: {:?}\nAbacus: {:?}",
                            osv2020_seats,
                            abacus_seats
                        );
                    }
                    _ => panic!("OSV2020 has conflict where Abacus has allocation")
                }
            }
            Err(ApportionmentError::DrawingOfLotsNotImplemented) => {
                match osv2020_result {
                    OSV2020Result::Allocated(osv2020_seats) => {
                        println!("OSV2020 seats: {:?}", osv2020_seats);
                        panic!("OSV2020 has allocation where Abacus requires drawing lots")
                    }
                    OSV2020Result::Conflict => {}
                }
            }
            Err(ApportionmentError::AllListsExhausted) => {} // ignore
            _ => panic!(),
        }
});
