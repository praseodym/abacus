import { PollingStation, useElectionStatus } from "@kiesraad/api";
import { t } from "@kiesraad/i18n";
import { Badge, Table } from "@kiesraad/ui";
import { getUrlForDataEntry } from "@kiesraad/util";

export interface PollingStationsListProps {
  pollingStations: PollingStation[];
}

export function PollingStationsList({ pollingStations }: PollingStationsListProps) {
  const electionStatus = useElectionStatus();

  return (
    <Table id="polling_station_list">
      <Table.Header>
        <Table.HeaderCell className="text-align-r">{t("number")}</Table.HeaderCell>
        <Table.HeaderCell>{t("polling_station.title.singular")}</Table.HeaderCell>
      </Table.Header>
      <Table.Body>
        {pollingStations.map((pollingStation: PollingStation) => {
          const status = electionStatus.statuses.find(
            (status) => status.polling_station_id === pollingStation.id,
          )?.status;

          return (
            <Table.LinkRow
              key={pollingStation.number}
              to={getUrlForDataEntry(pollingStation.election_id, pollingStation.id, status)}
            >
              <Table.NumberCell>{pollingStation.number}</Table.NumberCell>
              <Table.Cell>
                <span>{pollingStation.name}</span>
                {status && <Badge type={status} showIcon />}
              </Table.Cell>
            </Table.LinkRow>
          );
        })}
      </Table.Body>
    </Table>
  );
}
