export default {
  name: "paymentRecord",
  title: "Payment Record",
  type: "document",
  fields: [
    {
      name: "createdAt",
      title: "Payment Date",
      type: "datetime",
    },
    {
      name: "cardHolderName",
      title: "Card Holder Name",
      type: "string",
    },
    {
      name: "last4",
      title: "Last 4 Digits",
      type: "string",
    },
    {
      name: "cardType",
      title: "Card Type",
      type: "string",
    },
    {
      name: "amount",
      title: "Total Payment",
      type: "number",
    },
    {
      name: "currency",
      title: "Currency",
      type: "string",
    },
    {
      name: "receiptUrl",
      title: "Receipt URL",
      type: "url",
    },
  ],
};
