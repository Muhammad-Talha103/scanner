export default {
  name: "emailAttachment",
  title: "Email Attachment",
  type: "document",
  fields: [
    {
      name: "file",
      title: "File",
      type: "file", 
    },
    {
      name: "uploadedAt",
      title: "Uploaded At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    },
  ],
}
