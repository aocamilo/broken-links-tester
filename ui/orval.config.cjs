module.exports = {
  brokenLinks: {
    output: {
      mode: "tags-split",
      target: "./app/api/apiClient.ts",
      schemas: "./app/api/model",
      client: "react-query",
      override: {
        mutator: {
          path: "./app/api/custom-instance.ts",
          name: "customInstance",
        },
      },
    },
    input: {
      target: "../docs/swagger.json",
    },
  },
};
