import { useTranslation } from "react-i18next";
import { useDecks } from "../../api";
import { Badge, Text } from "../../ui/atoms";
import { ButtonList } from "../../ui/organisms";

export function DeckListPage({ onOpen }: { onOpen: (name: string) => void }) {
  const { t } = useTranslation("decks");
  const { t: tc } = useTranslation("common");
  const decks = useDecks();

  if (decks.error) return <Text tone="error">{decks.error.message}</Text>;
  if (!decks.data) return <Text tone="muted" size="sm">{tc("loading")}</Text>;

  return (
    <ButtonList
      onSelect={onOpen}
      items={decks.data.map((d) => ({
        id: d.name,
        content: d.name,
        trailing: (
          <>
            <Badge tone="info" title={t("new")}>{d.newCount}</Badge>{" "}
            <Badge tone="danger" title={t("learning")}>{d.learningCount}</Badge>{" "}
            <Badge tone="success" title={t("due")}>{d.dueCount}</Badge>
          </>
        ),
      }))}
    />
  );
}
