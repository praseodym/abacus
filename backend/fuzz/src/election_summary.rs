use std::num::NonZero;

use abacus::{
    data_entry::{Count, PoliticalGroupVotes, VotersCounts, VotesCounts},
    summary::{ElectionSummary, SummaryDifferencesCounts},
};
use libfuzzer_sys::arbitrary::{Arbitrary, Error, Result, Unstructured};

pub struct FuzzedElectionSummary {
    pub seats: u32,
    pub votes: Vec<Vec<Count>>,
    pub total_votes: Count,
    pub election_summary: ElectionSummary,
}

impl std::fmt::Debug for FuzzedElectionSummary {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("FuzzedElectionSummary")
            .field("seats", &self.seats)
            .field("votes", &self.votes)
            .field("total_votes", &self.total_votes)
            .finish()
    }
}

impl<'a> Arbitrary<'a> for FuzzedElectionSummary {
    fn arbitrary(u: &mut Unstructured<'a>) -> Result<Self> {
        let votes = if cfg!(feature = "simplified") {
            Vec::<(Count, NonZero<u8>)>::arbitrary(u)?
                .into_iter()
                .map(|(v, n)| {
                    let mut list = vec![0; n.get().into()];
                    list[0] = v;
                    list
                })
                .collect()
        } else {
            Vec::<Vec<Count>>::arbitrary(u)?
        };

        if votes.len() == 0 || votes.len() > 1000 {
            return Err(Error::IncorrectFormat);
        }

        for pg_votes in &votes {
            if pg_votes.len() == 0 {
                return Err(Error::IncorrectFormat);
            }
        }

        let total_votes: u64 = votes
            .iter()
            .map(|v| u64::from(v.iter().cloned().map(u64::from).sum::<u64>()))
            .sum();
        if total_votes == 0 || total_votes > 1_000_000_000 {
            return Err(Error::IncorrectFormat);
        }
        let total_votes = total_votes as u32;

        let political_group_votes: Vec<PoliticalGroupVotes> = votes
            .iter()
            .enumerate()
            .map(|(index, votes)| {
                PoliticalGroupVotes::from_test_data_auto((index + 1) as u32, &votes)
            })
            .collect();

        let blank_votes_count = u16::arbitrary(u)?;
        let invalid_votes_count = u16::arbitrary(u)?;
        let total_votes_cast_count =
            total_votes + blank_votes_count as Count + invalid_votes_count as Count;

        let seats = if cfg!(feature = "odd-only") {
            u32::from(u16::arbitrary(u)?) * 2 + 1
        } else {
            NonZero::<u16>::arbitrary(u)?.get().into() // 0 seats is not allowed (would give divide by 0 errors)
        };

        Ok(FuzzedElectionSummary {
            seats,
            votes,
            total_votes,
            election_summary: ElectionSummary {
                voters_counts: VotersCounts {
                    poll_card_count: total_votes,
                    proxy_certificate_count: 0,
                    voter_card_count: 0,
                    total_admitted_voters_count: total_votes,
                },
                votes_counts: VotesCounts {
                    votes_candidates_count: total_votes,
                    blank_votes_count: blank_votes_count as Count,
                    invalid_votes_count: invalid_votes_count as Count,
                    total_votes_cast_count,
                },
                differences_counts: SummaryDifferencesCounts::zero(),
                recounted_polling_stations: vec![],
                political_group_votes,
            },
        })
    }
}

impl FuzzedElectionSummary {
    pub fn unrestricted(mut self) -> FuzzedElectionSummary {
        for list in &mut self.votes {
            list.resize(self.seats as usize, 0)
        }

        self
    }
}
