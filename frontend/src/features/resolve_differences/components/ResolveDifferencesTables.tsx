import { t } from "@/lib/i18n";
import { PoliticalGroup, PoliticalGroupVotes, PollingStationResults } from "@/types/generated/openapi";
import { getCandidateFullName } from "@/utils/candidate";

import { DataEntrySection, getFromResults, sections } from "../utils/dataEntry";
import { DifferencesTable } from "./DifferencesTable";

export interface ResolveDifferencesTablesProps {
  first: PollingStationResults;
  second: PollingStationResults;
  politicalGroups: PoliticalGroup[];
}

export function ResolveDifferencesTables({ first, second, politicalGroups }: ResolveDifferencesTablesProps) {
  return (
    <>
      {sections.map((section) => (
        <SectionTable key={section.id} section={section} first={first} second={second} />
      ))}

      {politicalGroups.map((politicalGroup, i) => (
        <CandidatesTable
          key={politicalGroup.number}
          politicalGroup={politicalGroup}
          first={first.political_group_votes[i]}
          second={second.political_group_votes[i]}
        />
      ))}
    </>
  );
}

interface SectionTableProps {
  section: DataEntrySection;
  first: PollingStationResults;
  second: PollingStationResults;
}

function SectionTable({ section, first, second }: SectionTableProps) {
  const title = t(`resolve_differences.section.${section.id}`);

  const headers = [
    t("resolve_differences.headers.field"),
    t("resolve_differences.headers.first_entry"),
    t("resolve_differences.headers.second_entry"),
    t("resolve_differences.headers.description"),
  ];

  const rows = section.fields.map((field) => ({
    code: field.code,
    first: yesno(getFromResults(first, field.path)),
    second: yesno(getFromResults(second, field.path)),
    description: t(`polling_station_results.field.${field.path}`),
  }));

  return <DifferencesTable title={title} headers={headers} rows={rows} />;
}

function yesno<T>(value: T) {
  if (value === true) {
    return t("resolve_differences.yes");
  } else if (value === false) {
    return t("resolve_differences.no");
  } else {
    return value as Exclude<T, boolean>;
  }
}

interface CandidatesTableProps {
  politicalGroup: PoliticalGroup;
  first?: PoliticalGroupVotes;
  second?: PoliticalGroupVotes;
}

function CandidatesTable({ politicalGroup, first, second }: CandidatesTableProps) {
  if (!first || !second) {
    return null;
  }

  const title = `${t("list")} ${politicalGroup.number} – ${politicalGroup.name}`;

  const headers = [
    t("resolve_differences.headers.number"),
    t("resolve_differences.headers.first_entry"),
    t("resolve_differences.headers.second_entry"),
    t("resolve_differences.headers.candidate"),
  ];

  const rows = politicalGroup.candidates.map((candidate, i) => ({
    code: candidate.number,
    first: first.candidate_votes[i]?.votes,
    second: second.candidate_votes[i]?.votes,
    description: getCandidateFullName(candidate),
  }));

  return <DifferencesTable title={title} headers={headers} rows={rows} />;
}
