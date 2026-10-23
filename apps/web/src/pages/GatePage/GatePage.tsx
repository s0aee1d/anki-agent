import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAccess, useRequestAccess } from "../../api";
import { Button, Text } from "../../ui/atoms";
import { Header } from "../../ui/organisms";
import { AppShell } from "../../ui/templates";

export function GatePage({ children }: { children: ReactNode }) {
  const { t } = useTranslation("gate");
  const { t: tc } = useTranslation("common");
  const status = useAccess();
  const request = useRequestAccess();
  const auth = status.data;
  const error = status.error ?? request.error;

  if (auth?.status === "approved") return <>{children}</>;

  return (
    <AppShell header={<Header start={<span>{t("title")}</span>} />}>
      {error && <Text tone="error">{error.message}</Text>}
      {status.isPending && !error && <Text tone="muted" size="sm">{tc("loading")}</Text>}
      {auth?.status === "none" && (
        <>
          <Text tone="muted" size="sm">{t("notApproved")}</Text>
          <Button onClick={() => request.mutate()} disabled={request.isPending}>
            {t("requestAccess")}
          </Button>
        </>
      )}
      {auth?.status === "pending" && (
        <>
          <Text tone="muted" size="sm">{t("waiting")}</Text>
          <Text size="display">{auth.deviceId}</Text>
          <Text tone="muted" size="sm">{t("continues")}</Text>
        </>
      )}
    </AppShell>
  );
}
