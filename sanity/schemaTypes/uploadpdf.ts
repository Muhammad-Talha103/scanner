// schemas/pdfDocument.ts
export default {
  name: "pdfDocument",
  title: "PDF Document",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
    
    },
    {
      name: "file",
      title: "File",
      type: "file",
      options: {
        accept: ".pdf",
      },

    },
  ],
};
