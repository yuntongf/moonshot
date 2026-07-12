import { Application } from "@moonshot/contracts";
import { createPrepDocument, loadSnapshot, saveSnapshot } from '@moonshot/collaboration';
import { createSignal, onCleanup, onMount } from "solid-js";

interface DocumentProps {
  application: Application
}

export function Document(props: DocumentProps) {
  const { doc, notes } = createPrepDocument();
  const [prepText, setPrepText] = createSignal(notes.toString());
  const documentId = `prep:${props.application.id}`;

  const unsubscribe = doc.subscribe(() => {
    setPrepText(notes.toString());
  });

  let saveTimer: ReturnType<typeof setInterval> | undefined;

  onMount(async () => {
    const snapshot = await loadSnapshot(documentId);
    if (snapshot) {
      doc.import(snapshot);
    } else {
      notes.insert(0, `Interview preparation for ${props.application.company}\n\n`);
    }

    setPrepText(notes.toString());

    saveTimer = setInterval(async () => {
      await saveSnapshot(documentId, doc.export({ 'mode': 'snapshot' }));
    }, 5_000)
  });

  onCleanup(async () => {
    unsubscribe();

    if (saveTimer)
      clearInterval(saveTimer);

    await saveSnapshot(documentId, doc.export({'mode': 'snapshot'}))
  })

  return <div>
    <textarea
      value={prepText()}
      onInput={(e) => notes.update(e.currentTarget.value)}
    />
  </div>
}
