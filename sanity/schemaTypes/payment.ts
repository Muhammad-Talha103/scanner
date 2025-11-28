// export default {
//   name: "premiumUser",
//   type: "document",
//   title: "Premium Users",
//   fields: [
//     { name: "name", type: "string", title: "Name" },
//     { name: "email", type: "string", title: "Email" },
//     {
//       name: "payments",
//       type: "array",
//       title: "Payments",
//       of: [
//         {
//           type: "object",
//           title: "Payment",
//           fields: [
//             { name: "stripeSessionId", type: "string", title: "Stripe Session ID" },
//             { name: "stripePaymentIntentId", type: "string", title: "PaymentIntent ID" },
//             { name: "stripeChargeId", type: "string", title: "Charge ID" },
//             { name: "amount_total", type: "number", title: "Amount Total" },
//             { name: "currency", type: "string", title: "Currency" },
//             { name: "status", type: "string", title: "Payment Status" },
//             { name: "payment_method_type", type: "string", title: "Payment Method Type" },
//             {
//               name: "card",
//               type: "object",
//               title: "Card Details",
//               fields: [
//                 { name: "brand", type: "string", title: "Brand" },
//                 { name: "last4", type: "string", title: "Last 4 Digits" },
//                 { name: "exp_month", type: "number", title: "Exp Month" },
//                 { name: "exp_year", type: "number", title: "Exp Year" },
//               ],
//             },
//             {
//               name: "billing_address",
//               type: "object",
//               title: "Billing Address",
//               fields: [
//                 { name: "line1", type: "string", title: "Line 1" },
//                 { name: "line2", type: "string", title: "Line 2" },
//                 { name: "city", type: "string", title: "City" },
//                 { name: "state", type: "string", title: "State" },
//                 { name: "postal_code", type: "string", title: "Postal Code" },
//                 { name: "country", type: "string", title: "Country" },
//               ],
//             },
//             {
//               name: "metadata",
//               type: "object",
//               title: "Metadata",
//              fields: [
//     { name: "key", type: "string", title: "Key" },
//     { name: "value", type: "string", title: "Value" },
//   ]
//             },
//             {
//               name: "lineItems",
//               type: "array",
//               title: "Line Items",
//               of: [
//                 {
//                   type: "object",
//                   title: "Line Item",
//                   fields: [
//                     { name: "id", type: "string", title: "Line Item ID" },
//                     { name: "description", type: "string", title: "Description" },
//                     { name: "price", type: "string", title: "Price ID" },
//                     { name: "product", type: "string", title: "Product ID" },
//                     { name: "quantity", type: "number", title: "Quantity" },
//                     { name: "amount_total", type: "number", title: "Amount Total" },
//                     { name: "currency", type: "string", title: "Currency" },
//                   ],
//                 },
//               ],
//             },
//             {
//               name: "createdAt",
//               type: "datetime",
//               title: "Created At",
//               initialValue: () => new Date().toISOString(),
//             },
//           ],
//         },
//       ],
//     },
//     { name: "premiumStart", type: "datetime", title: "Premium Start" },
//     { name: "premiumEnd", type: "datetime", title: "Premium End" },
//     {
//       name: "createdAt",
//       type: "datetime",
//       title: "User Created At",
//       initialValue: () => new Date().toISOString(),
//     },
//   ],
// };




export default {
  name: "premiumUser",
  type: "document",
  title: "Premium Users",
  fields: [
    {
      name: "name",
      type: "string",
      title: "Name",
    },
    {
      name: "email",
      type: "string",
      title: "Email",
      validation: (Rule: any) => Rule.required().email(),
    },
    {
      name: "payments",
      type: "array",
      title: "Payments",
      of: [
        {
          type: "object",
          title: "Payment",
          fields: [
            {
              name: "stripeSessionId",
              type: "string",
              title: "Stripe Session ID",
            },
            {
              name: "stripePaymentIntentId",
              type: "string",
              title: "PaymentIntent ID",
            },
            {
              name: "stripeChargeId",
              type: "string",
              title: "Charge ID",
            },
            {
              name: "amount_total",
              type: "number",
              title: "Amount Total (cents)",
            },
            {
              name: "currency",
              type: "string",
              title: "Currency",
            },
            {
              name: "status",
              type: "string",
              title: "Payment Status",
            },
            {
              name: "payment_method_type",
              type: "string",
              title: "Payment Method Type",
            },
            {
              name: "card",
              type: "object",
              title: "Card Details",
              fields: [
                { name: "brand", type: "string", title: "Brand" },
                { name: "last4", type: "string", title: "Last 4 Digits" },
                { name: "exp_month", type: "number", title: "Exp Month" },
                { name: "exp_year", type: "number", title: "Exp Year" },
              ],
            },
            {
              name: "billing_address",
              type: "object",
              title: "Billing Address",
              fields: [
                { name: "line1", type: "string", title: "Line 1" },
                { name: "line2", type: "string", title: "Line 2" },
                { name: "city", type: "string", title: "City" },
                { name: "state", type: "string", title: "State" },
                { name: "postal_code", type: "string", title: "Postal Code" },
                { name: "country", type: "string", title: "Country" },
              ],
            },
            {
              name: "metadata",
              type: "array",
              title: "Metadata",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "key", type: "string" },
                    { name: "value", type: "string" },
                  ],
                },
              ],
            },
            {
              name: "lineItems",
              type: "array",
              title: "Line Items",
              of: [
                {
                  type: "object",
                  title: "Line Item",
                  fields: [
                    { name: "id", type: "string", title: "Line Item ID" },
                    {
                      name: "description",
                      type: "string",
                      title: "Description",
                    },
                    { name: "price", type: "string", title: "Price ID" },
                    { name: "product", type: "string", title: "Product ID" },
                    { name: "quantity", type: "number", title: "Quantity" },
                    {
                      name: "amount_total",
                      type: "number",
                      title: "Amount Total",
                    },
                    { name: "currency", type: "string", title: "Currency" },
                  ],
                },
              ],
            },
            {
              name: "createdAt",
              type: "datetime",
              title: "Created At",
              initialValue: () => new Date().toISOString(),
            },
          ],
        },
      ],
    },
    {
      name: "premiumStart",
      type: "datetime",
      title: "Premium Start Date",
    },
    {
      name: "premiumEnd",
      type: "datetime",
      title: "Premium End Date",
    },
    {
      name: "createdAt",
      type: "datetime",
      title: "User Created At",
      initialValue: () => new Date().toISOString(),
    },
  ],
}
