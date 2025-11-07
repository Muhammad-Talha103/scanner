export default {
  name: "downloadMapping",
  title: "Download Mapping",
  type: "document",
  fields: [
    {
      name: "hash",
      title: "Hash",
      type: "string",
    //   validation: (Rule) => Rule.required(),
    },
    {
      name: "targetUrl",
      title: "Target URL",
      type: "url",
    //   validation: (Rule) => Rule.required(),
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    },
  ],
};
