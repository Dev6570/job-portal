// Turn an axios error into a message safe to show the user.
// FastAPI sends either {detail: "text"} or, for 422 validation errors,
// {detail: [{loc: ["body", "password"], msg: "..."}, ...]}.
export function extractErrorMessage(err, fallback = "Something went wrong") {
  if (!err || !err.response) {
    return "Cannot reach the server. Is the backend running?";
  }
  const detail = err.response.data && err.response.data.detail;
  if (typeof detail === "string" && detail) {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        const loc = Array.isArray(item.loc)
          ? item.loc.filter((part) => part !== "body").join(".")
          : "";
        const msg = item.msg || "Invalid value";
        return loc ? loc + ": " + msg : msg;
      })
      .join("; ");
  }
  return fallback;
}
