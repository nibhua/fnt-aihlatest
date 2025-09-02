export type Mode = "legacy" | "context"

export interface UploadedFile {
  id: string
  name: string
  size: number
  uploadedAt: Date
}

export interface QueryFile {
  id: string
  name: string
  size: number
  uploadedAt: Date
  url: string // blob URL
}

export interface QueryPdfSource {
  queryPdfId: string
  queryPdfName: string
  selectedText: string
  fromResultClick?: boolean
}

export interface ExpandedResult {
  [key: string]: boolean
}
