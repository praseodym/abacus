import type {
  ClaimDataEntryResponse,
  PollingStationResults,
  SaveDataEntryResponse,
  ValidationResults,
} from "@/types/generated/openapi";

import { electionMockData } from "./ElectionMockData";

export const emptyValidationResults: ValidationResults = {
  errors: [],
  warnings: [],
};

export const emptyData: PollingStationResults = {
  voters_counts: {
    poll_card_count: 0,
    proxy_certificate_count: 0,
    voter_card_count: 0,
    total_admitted_voters_count: 0,
  },
  votes_counts: {
    votes_candidates_count: 0,
    blank_votes_count: 0,
    invalid_votes_count: 0,
    total_votes_cast_count: 0,
  },
  differences_counts: {
    more_ballots_count: 0,
    fewer_ballots_count: 0,
    unreturned_ballots_count: 0,
    too_few_ballots_handed_out_count: 0,
    too_many_ballots_handed_out_count: 0,
    other_explanation_count: 0,
    no_explanation_count: 0,
  },
  political_group_votes: electionMockData.political_groups.map((group) => ({
    number: group.number,
    total: 0,
    candidate_votes: group.candidates.map((candidate) => ({
      number: candidate.number,
      votes: 0,
    })),
  })),
};

export const claimDataEntryResponse: ClaimDataEntryResponse = {
  data: emptyData,
  validation_results: emptyValidationResults,
  client_state: null,
};

export const saveDataEntryResponse: SaveDataEntryResponse = {
  validation_results: emptyValidationResults,
};
