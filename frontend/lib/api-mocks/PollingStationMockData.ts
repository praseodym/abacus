import { PollingStationListResponse } from "@kiesraad/api";

export const pollingStationMockData: PollingStationListResponse = {
  polling_stations: [
    {
      election_id: 1,
      id: 1,
      number: 33,
      name: 'Stembureau "Op Rolletjes"',
      house_number: "1",
      locality: "Den Haag",
      polling_station_type: "Mobiel",
      postal_code: "1234 YQ",
      street: "Rijksweg A12",
    },
    {
      election_id: 1,
      id: 2,
      number: 34,
      name: "Testplek",
      house_number: "2",
      locality: "Testdorp",
      polling_station_type: "Bijzonder",
      postal_code: "1234 QY",
      street: "Teststraat",
    },
  ],
};
