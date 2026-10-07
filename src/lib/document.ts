export interface DocumentSection {
  number: string;
  title: string;
  body: string;
}

export interface ParsedDocument {
  intro: string;
  sections: DocumentSection[];
}

// Long-form documents (the acknowledgement) are stored as plain text using the
// line wrapping of the source document. On a narrow screen that wrapping is
// inherited verbatim and the copy breaks mid-sentence, which reads as jumbled
// text. Re-flow the source into paragraphs and numbered sections so any
// browser, at any width, shows the copy in reading order.
export function parseDocument(content: string): ParsedDocument {
  const intro: string[] = [];
  const sections: DocumentSection[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = /^(\d{1,2})\.\s+(\S.*)$/.exec(line);
    // Only a heading when the number continues the sequence — otherwise a
    // line that merely starts with a number belongs to the body.
    if (heading && Number(heading[1]) === sections.length + 1) {
      sections.push({number: heading[1], title: heading[2].trim(), body: ''});
      continue;
    }

    const section = sections[sections.length - 1];
    if (section) {
      section.body = section.body ? `${section.body} ${line}` : line;
    } else {
      intro.push(line);
    }
  }

  return {intro: intro.join(' '), sections};
}
