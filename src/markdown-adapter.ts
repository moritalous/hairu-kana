import { marked } from "marked";

export function markdownToHTML(markdown: string): string {
	if (!markdown.trim()) return "";
	return marked.parse(markdown, { gfm: true }) as string;
}
