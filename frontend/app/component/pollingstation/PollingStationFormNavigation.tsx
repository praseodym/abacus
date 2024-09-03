import * as React from "react";
import { BlockerFunction, useBlocker, useNavigate } from "react-router-dom";

import {
  AnyFormReference,
  currentFormHasChanges,
  Election,
  FormSectionID,
  FormState,
  PollingStationValues,
  usePollingStationFormController,
} from "@kiesraad/api";
import { Button, Feedback, Modal } from "@kiesraad/ui";

export interface PollingStationFormNavigationProps {
  pollingStationId: number;
  election: Required<Election>;
}

export function PollingStationFormNavigation({
  pollingStationId,
  election,
}: PollingStationFormNavigationProps) {
  const _lastKnownSection = React.useRef<FormSectionID | null>(null);
  const {
    formState,
    error,
    currentForm,
    targetFormSection,
    values,
    setTemporaryCache,
    submitCurrentForm,
  } = usePollingStationFormController();

  const navigate = useNavigate();
  //one time flag to prioritize user navigation over controller navigation
  const overrideControllerNavigation = React.useRef<string | null>(null);

  const getUrlForFormSection = React.useCallback(
    (id: FormSectionID) => {
      const baseUrl = `/${election.id}/input/${pollingStationId}`;
      let url: string = "";
      if (id.startsWith("political_group_votes_")) {
        url = `${baseUrl}/list/${id.replace("political_group_votes_", "")}`;
      } else {
        switch (id) {
          case "recounted":
            url = `${baseUrl}/recounted`;
            break;
          case "differences_counts":
            url = `${baseUrl}/differences`;
            break;
          case "voters_votes_counts":
            url = `${baseUrl}/numbers`;
            break;
          case "save":
            url = `${baseUrl}/save`;
            break;
        }
      }

      return url;
    },
    [election, pollingStationId],
  );

  const shouldBlock = React.useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      if (currentLocation.pathname === nextLocation.pathname) {
        return false;
      }
      if (!currentForm) {
        return false;
      }

      const reasons = reasonsBlocked(formState, currentForm, values);
      //currently only block on changes
      if (reasons.includes("changes")) {
        if (formState.active === formState.current) {
          setTemporaryCache({
            key: currentForm.id,
            data: currentForm.getValues(),
          });
          return false;
        }
        return true;
      }

      return false;
    },
    [formState, currentForm, setTemporaryCache, values],
  );

  const blocker = useBlocker(shouldBlock);

  //prevent navigating to sections that are not yet active
  React.useEffect(() => {
    const activeSection = formState.sections[formState.active];
    const currentSection = formState.sections[formState.current];
    if (activeSection && currentSection) {
      if (activeSection.index > currentSection.index) {
        const url = getUrlForFormSection(currentSection.id);
        navigate(url);
      }
    }
    _lastKnownSection.current = formState.active;
  }, [formState, navigate, getUrlForFormSection]);

  //check if the targetFormSection has changed and navigate to the correct url
  React.useEffect(() => {
    if (!targetFormSection) return;
    if (overrideControllerNavigation.current) {
      const url = overrideControllerNavigation.current;
      overrideControllerNavigation.current = null;
      navigate(url);
      return;
    }
    if (targetFormSection !== _lastKnownSection.current) {
      _lastKnownSection.current = targetFormSection;
      const url = getUrlForFormSection(targetFormSection);
      navigate(url);
    }
  }, [targetFormSection, getUrlForFormSection, navigate]);

  return (
    <>
      {blocker.state === "blocked" && (
        <Modal
          onClose={() => {
            blocker.reset();
          }}
        >
          <h2 id="modal-blocker-title">Let op: niet opgeslagen wijzigingen</h2>
          <p>
            Je hebt in{" "}
            <strong>
              {formState.sections[formState.active]?.title || "het huidige formulier"}
            </strong>{" "}
            wijzigingen gemaakt die nog niet zijn opgeslagen.
          </p>
          <p>Wil je deze wijzigingen bewaren?</p>
          <nav>
            <Button
              size="lg"
              onClick={() => {
                overrideControllerNavigation.current = blocker.location.pathname;
                submitCurrentForm();
                blocker.reset();
              }}
            >
              Wijzigingen opslaan
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                blocker.proceed();
              }}
            >
              Niet bewaren
            </Button>
          </nav>
        </Modal>
      )}

      {error && (
        <Feedback type="error" title="Server error">
          <div id="feedback-server-error">
            {error.errorCode}: {error.message}
          </div>
        </Feedback>
      )}
    </>
  );
}

type BlockReason = "errors" | "warnings" | "changes";

function reasonsBlocked(
  formState: FormState,
  currentForm: AnyFormReference,
  values: PollingStationValues,
): BlockReason[] {
  const result: BlockReason[] = [];

  const formSection = formState.sections[currentForm.id];
  if (formSection) {
    if (formSection.errors.length > 0) {
      result.push("errors");
    }
    if (formSection.warnings.length > 0 && !formSection.ignoreWarnings) {
      result.push("warnings");
    }

    if (
      (currentForm.getIgnoreWarnings &&
        formSection.ignoreWarnings !== currentForm.getIgnoreWarnings()) ||
      currentFormHasChanges(currentForm, values)
    ) {
      result.push("changes");
    }
  }

  return result;
}