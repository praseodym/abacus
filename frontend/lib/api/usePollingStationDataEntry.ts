import * as React from "react";
import { useApiPostRequest } from "./useApiPostRequest";
import {
  POLLING_STATION_DATA_ENTRY_REQUEST_BODY,
  POLLING_STATION_DATA_ENTRY_REQUEST_PARAMS,
  POLLING_STATION_DATA_ENTRY_REQUEST_PATH,
  DataEntryResponse,
} from "./gen/openapi";

export function usePollingStationDataEntry(params: POLLING_STATION_DATA_ENTRY_REQUEST_PARAMS) {
  const path = React.useMemo(() => {
    const result: POLLING_STATION_DATA_ENTRY_REQUEST_PATH = `/api/polling_stations/${params.polling_station_id}/data_entries/${params.entry_number}`;
    return result;
  }, [params]);

  return useApiPostRequest<POLLING_STATION_DATA_ENTRY_REQUEST_BODY, DataEntryResponse>({
    path,
  });
}