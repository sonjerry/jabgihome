export type Attachment = { id: string; name: string; type: string; url: string }
export type Comment = { id: string; author: string; text: string; createdAt: string }
export type Post = {
  id: string; title: string; content: string; category: string; tags: string[];
  createdAt: string; updatedAt?: string; comments: Comment[]; attachments?: Attachment[]
}
