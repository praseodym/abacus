import { useLocation } from "react-router";

import { Footer } from "@/components/footer/Footer";
import { NavBar } from "@/components/navbar/NavBar";
import { PageTitle } from "@/components/page_title/PageTitle";
import { StickyNav } from "@/components/ui/AppLayout/StickyNav";
import { FileInput } from "@/components/ui/FileInput/FileInput";
import { ProgressList } from "@/components/ui/ProgressList/ProgressList";
import { t } from "@/lib/i18n";

export function ElectionCreatePage() {
  const location = useLocation();

  return (
    <>
      <PageTitle title={`${t("election.create")} - Abacus`} />
      <NavBar location={location} />
      <header>
        <section>
          <h1>{t("election.create")}</h1>
        </section>
      </header>
      <main>
        <StickyNav>
          <ProgressList>
            <ProgressList.Fixed>
              <ProgressList.Item key="election_definition" status="idle" active>
                <span>{t("election_definition")}</span>
              </ProgressList.Item>
              <ProgressList.Item key="polling_station_role" status="idle">
                <span>{t("polling_station.role")}</span>
              </ProgressList.Item>
              <ProgressList.Item key="list_of_candidates" status="idle">
                <span>{t("candidate.list.plural")}</span>
              </ProgressList.Item>
              <ProgressList.Item key="polling_stations" status="idle">
                <span>{t("polling_stations")}</span>
              </ProgressList.Item>
              <ProgressList.Item key="counting_method_type" status="idle">
                <span>{t("counting_method_type")}</span>
              </ProgressList.Item>
            </ProgressList.Fixed>
            <div className="mt-md">
              <ProgressList.Fixed>
                <ProgressList.Item key="check_and_save" status="idle">
                  <span>{t("check_and_save.title")}</span>
                </ProgressList.Item>
              </ProgressList.Fixed>
            </div>
          </ProgressList>
        </StickyNav>

        <article>
          <h2>{t("election.import_eml")}</h2>
          <p className="mt-lg mb-lg">{t("election.use_instructions_to_import_eml")}</p>
          <FileInput id="upload-eml">{t("select_file")}</FileInput>
        </article>
      </main>
      <Footer />
    </>
  );
}
