export type Attachment = { id: string; name: string; type: string; url: string }
export type Post = {
  id: string; title: string; content: string; category: string; tags: string[];
  createdAt: string; updatedAt?: string; attachments?: Attachment[]
}
