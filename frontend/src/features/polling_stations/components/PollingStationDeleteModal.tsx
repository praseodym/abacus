import { isSuccess } from "@/api/ApiResult";
import { useCrud } from "@/api/useCrud";
import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { t } from "@/lib/i18n";

export interface PollingStationDeleteModalProps {
  electionId: number;
  pollingStationId: number;
  onDeleted: () => void;
  onError: () => void;
  onCancel: () => void;
}

export function PollingStationDeleteModal({
  electionId,
  pollingStationId,
  onDeleted,
  onCancel,
  onError,
}: PollingStationDeleteModalProps) {
  const { remove, requestState } = useCrud(`/api/elections/${electionId}/polling_stations/${pollingStationId}`);

  function handleDelete() {
    void remove().then((result) => {
      if (isSuccess(result)) {
        onDeleted();
      } else {
        onError();
      }
    });
  }

  const deleting = requestState.status === "loading";

  return (
    <Modal title={t("polling_station.delete")} onClose={onCancel}>
      <p>{t("polling_station.delete_are_you_sure")}</p>
      <nav>
        <Button variant="primary-destructive" size="lg" onClick={handleDelete} disabled={deleting}>
          {t("delete")}
        </Button>
        <Button variant="secondary" size="lg" onClick={onCancel} disabled={deleting}>
          {t("cancel")}
        </Button>
      </nav>
    </Modal>
  );
}
