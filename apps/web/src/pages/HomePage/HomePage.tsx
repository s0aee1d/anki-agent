import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { useSync } from "../../api";
import { formatTime } from "../../lib";
import { activeDeckAtom, chatOpenAtom } from "../../state";
import { Button, Text } from "../../ui/atoms";
import { Header } from "../../ui/organisms";
import { AppShell } from "../../ui/templates";
import { ChatPage } from "../ChatPage";
import { DeckListPage } from "../DeckListPage";
import { ReviewPage } from "../ReviewPage";

export function HomePage() {
  const { t, i18n } = useTranslation("home");
  const [deck, setDeck] = useAtom(activeDeckAtom);
  const [chatOpen, setChatOpen] = useAtom(chatOpenAtom);
  const sync = useSync();
  const runSync = () => sync.mutate();

  const syncedAt = sync.data ? formatTime(sync.data.at, i18n.language) : null;

  return (
    <AppShell
      header={
        <Header
          start={
            <Button tone="link" onClick={() => setDeck(null)}>
              {deck ? t("backToDecks") : t("title")}
            </Button>
          }
          end={
            <>
              <Button onClick={() => setChatOpen(true)}>{t("openClaw")}</Button>
              <Button onClick={runSync} disabled={sync.isPending}>
                {sync.isPending ? t("syncing") : t("sync")}
              </Button>
            </>
          }
        />
      }
      notice={
        <>
          {syncedAt && <Text tone="muted" size="sm">{t("synced", { time: syncedAt })}</Text>}
          {sync.error && <Text tone="error">{sync.error.message}</Text>}
        </>
      }
      overlay={chatOpen && <ChatPage onClose={() => setChatOpen(false)} />}
    >
      {deck ? <ReviewPage deck={deck} onSync={runSync} /> : <DeckListPage onOpen={setDeck} />}
    </AppShell>
  );
}
