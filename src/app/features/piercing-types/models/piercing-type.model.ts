export interface PiercingTypeRow {
  label: string;
  sourceFilename: string;
  updatedAt: string | null;
  pdfBytes: number;
  isTattoo: boolean;
}

export interface PiercingTypeDetail extends PiercingTypeRow {
  pdfBase64: string;
}

export interface PiercingTypeWritePayload {
  survey_option_label: string;
  source_filename: string;
  pdf_base64: string;
}

export interface PiercingTypeUpdatePayload {
  survey_option_label?: string;
  source_filename?: string;
  pdf_base64?: string;
}

export interface PiercingTypeModalData {
  label?: string;
  sourceFilename?: string;
}
