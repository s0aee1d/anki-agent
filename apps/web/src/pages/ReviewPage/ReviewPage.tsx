import { useAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAnswerCard, useNextCard } from "../../api";
import type { Ease } from "../../domain";
import { answerShownAtom } from "../../state";
import { Button, HtmlFrame, Text } from "../../ui/atoms";
import { ActionBar } from "../../ui/molecules";
import { EmptyState } from "../../ui/organisms";
import { FocusLayout } from "../../ui/templates";

export function ReviewPage({ deck, onSync }: { deck: string; onSync: () => void }) {
  const { t } = useTranslation("review");
  const { t: tc } = useTranslation("common");
  const next = useNextCard(deck);
  const answer = useAnswerCard(deck);
  const [shown, setShown] = useAtom(answerShownAtom);
  const card = next.data?.card ?? null;

  useEffect(() => setShown(false), [deck, setShown]);

  const rate = useCallback(
    (ease: Ease) => {
      if (!card || answer.isPending) return;
      answer.mutate({ cardId: card.id, ease }, { onSuccess: () => setShown(false) });
    },
    [card, answer, setShown],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setShown(true);
      } else if (shown && ["1", "2", "3", "4"].includes(e.key)) rate(Number(e.key) as Ease);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, rate, setShown]);

  const error = next.error ?? answer.error;
  if (error) return <Text tone="error">{error.message}</Text>;
  if (next.isPending) return <Text tone="muted" size="sm">{tc("loading")}</Text>;
  if (!card)
    return (
      <EmptyState
        message={t("noneDue", { deck })}
        action={<Button onClick={onSync}>{t("sync")}</Button>}
      />
    );

  const html = `<style>${card.css}</style>${shown ? card.answer : card.question}`;
  return (
    <FocusLayout
      meta={<Text tone="muted" size="sm">{t("remaining", { count: next.data?.remaining ?? 0 })}</Text>}
      content={<HtmlFrame title={t("cardTitle")} html={html} />}
      actions={
        <ActionBar>
          {shown ? (
            <>
              <Button tone="danger" onClick={() => rate(1)}>{t("again")}</Button>
              <Button tone="warning" onClick={() => rate(2)}>{t("hard")}</Button>
              <Button tone="success" onClick={() => rate(3)}>{t("good")}</Button>
              <Button tone="info" onClick={() => rate(4)}>{t("easy")}</Button>
            </>
          ) : (
            <Button tone="primary" onClick={() => setShown(true)}>{t("showAnswer")}</Button>
          )}
        </ActionBar>
      }
    />
  );
}
