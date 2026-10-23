"""Headless study bridge: one python-anki process per request.

ankicli starts a fresh Python (~0.8s) per call and can neither render card templates
nor write review grades into scheduling, so the hot study paths run here instead,
using the same python-anki runtime ankicli ships with.

Usage: review.py <collection.anki2> decks
       review.py <collection.anki2> next <deck>
       review.py <collection.anki2> answer <card_id> <ease 1-4>
Prints one JSON object as the last stdout line; on failure writes a message to stderr and exits 1.
"""
import json
import sys

from anki.collection import Collection


def flatten(node, prefix=""):
    name = f"{prefix}{node.name}"
    yield node, name
    for child in node.children:
        yield from flatten(child, f"{name}::")


def decks(col):
    out = []
    for top in col.sched.deck_due_tree().children:
        for node, name in flatten(top):
            out.append(
                {
                    "deck_id": node.deck_id,
                    "name": name,
                    "new_count": node.new_count,
                    "learn_count": node.learn_count,
                    "review_count": node.review_count,
                    "total_in_deck": col.decks.card_count(node.deck_id, include_subdecks=True),
                }
            )
    return out


def next_card(col, deck):
    safe = deck.replace('"', '\\"')
    ids = col.find_cards(f'deck:"{safe}" (is:due OR is:new) -is:suspended -is:buried')
    if not ids:
        return {"card": None, "remaining": 0}
    card = col.get_card(ids[0])
    out = card.render_output()
    return {
        "card": {
            "cardId": card.id,
            "noteId": card.nid,
            "deckName": col.decks.name(card.did),
            "question": out.question_text,
            "answer": out.answer_text,
            "css": out.css,
        },
        "remaining": len(ids),
    }


def answer(col, card_id, ease):
    if ease not in (1, 2, 3, 4):
        raise ValueError("ease must be 1-4")
    card = col.get_card(card_id)
    card.start_timer()
    col.sched.answerCard(card, ease)
    return {"ok": True}


def main(argv):
    col = Collection(argv[1])
    try:
        op = argv[2]
        if op == "decks":
            out = decks(col)
        elif op == "next":
            out = next_card(col, argv[3])
        elif op == "answer":
            out = answer(col, int(argv[3]), int(argv[4]))
        else:
            raise ValueError(f"unknown op {op}")
        print(json.dumps(out))
    finally:
        col.close()


if __name__ == "__main__":
    try:
        main(sys.argv)
    except Exception as e:  # noqa: BLE001
        print(str(e), file=sys.stderr)
        sys.exit(1)
