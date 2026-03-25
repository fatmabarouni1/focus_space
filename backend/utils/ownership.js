// Applies owner scoping for non-admins.
const withOwner = (req, filter, ownerField = "user_id") => {
  if (req.user?.role === "admin") {
    return filter;
  }
  return { ...filter, [ownerField]: req.user.id };
};

export { withOwner };
