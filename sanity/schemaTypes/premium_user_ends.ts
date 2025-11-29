export default {
  name: "premium_user_ends",
  type: "document",
  title: "Expired Premium Users",
  fields: [
    {
      name: "namelll",
      type: "string",
      title: "Name",
    },
    {
      name: "emaillll",
      type: "string",
      title: "Email",
    },
    // {
    //   name: "payments",
    //   type: "array",
    //   title: "Payments",
    //   of: [
    //     {
    //       type: "object",
    //       title: "Payment",
    //       fields: [
    //         { name: "amount", type: "number", title: "Amount" },
    //         { name: "currency", type: "string", title: "Currency" },
    //         { name: "status", type: "string", title: "Status" },
    //         { name: "date", type: "datetime", title: "Date" },
    //       ],
    //     },
    //   ],
    // },
    // {
    //   name: "premiumStart",
    //   type: "datetime",
    //   title: "Premium Start",
    // },
    // {
    //   name: "premiumEnd",
    //   type: "datetime",
    //   title: "Premium End",
    // },
    // {
    //   name: "movedAt",
    //   type: "datetime",
    //   title: "Moved At",
    //   initialValue: () => new Date().toISOString(),
    // },
  ],
};
