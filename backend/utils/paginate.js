import mongoose from "mongoose";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const clampLimit = (value) => {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.trunc(value), MAX_LIMIT);
};

const normalizeCursorValue = (rawValue, sortField) => {
  if (sortField === "_id") {
    if (!mongoose.Types.ObjectId.isValid(rawValue)) {
      throw new Error("Invalid pagination params");
    }
    return new mongoose.Types.ObjectId(rawValue);
  }

  const decoded = decodeURIComponent(rawValue);
  const dateValue = new Date(decoded);
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error("Invalid pagination params");
  }
  return dateValue;
};

const parseCompositeCursor = (cursor, sortField) => {
  if (!cursor) return null;
  if (sortField === "_id") {
    return {
      value: normalizeCursorValue(cursor, "_id"),
      id: normalizeCursorValue(cursor, "_id"),
    };
  }

  const [rawValue, rawId] = String(cursor).split("::");
  if (!rawValue || !rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
    throw new Error("Invalid pagination params");
  }

  return {
    value: normalizeCursorValue(rawValue, sortField),
    id: new mongoose.Types.ObjectId(rawId),
  };
};

const buildCursorFilter = (cursor, sortField, sortOrder) => {
  if (!cursor) return {};
  const parsed = parseCompositeCursor(cursor, sortField);

  if (sortField === "_id") {
    return {
      _id: {
        [sortOrder === -1 ? "$lt" : "$gt"]: parsed.id,
      },
    };
  }

  const primaryOperator = sortOrder === -1 ? "$lt" : "$gt";
  const secondaryOperator = sortOrder === -1 ? "$lt" : "$gt";

  return {
    $or: [
      {
        [sortField]: {
          [primaryOperator]: parsed.value,
        },
      },
      {
        [sortField]: parsed.value,
        _id: {
          [secondaryOperator]: parsed.id,
        },
      },
    ],
  };
};

const buildNextCursor = (item, sortField) => {
  if (!item?._id) return null;
  if (sortField === "_id") {
    return String(item._id);
  }

  const rawValue = item[sortField];
  const serialized =
    rawValue instanceof Date
      ? rawValue.toISOString()
      : new Date(rawValue).toISOString();

  return `${encodeURIComponent(serialized)}::${String(item._id)}`;
};

const createPaginationEnvelope = (data, pagination) => ({
  success: true,
  data,
  pagination: {
    hasMore: Boolean(pagination.hasMore),
    nextCursor: pagination.nextCursor ?? null,
    total: pagination.total ?? data.length,
    limit: pagination.limit,
  },
});

const applyQueryOptions = (query, { select, populate, lean = true }) => {
  if (select) {
    query.select(select);
  }

  if (populate) {
    const populations = Array.isArray(populate) ? populate : [populate];
    populations.forEach((population) => {
      query.populate(population);
    });
  }

  if (lean) {
    query.lean();
  }

  return query;
};

const paginateCursor = async ({
  model,
  filter = {},
  totalFilter,
  limit = DEFAULT_LIMIT,
  cursor = null,
  sortField = "_id",
  sortOrder = -1,
  select,
  populate,
  lean = true,
  transform = (item) => item,
}) => {
  const safeLimit = clampLimit(limit);
  const cursorFilter = buildCursorFilter(cursor, sortField, sortOrder);
  const queryFilter = {
    ...filter,
    ...cursorFilter,
  };

  const sort = { [sortField]: sortOrder, _id: sortOrder };
  const query = model.find(queryFilter).sort(sort).limit(safeLimit + 1);
  applyQueryOptions(query, { select, populate, lean });

  const [items, total] = await Promise.all([
    query.exec(),
    model.countDocuments(totalFilter ?? filter),
  ]);

  const hasMore = items.length > safeLimit;
  const pageItems = hasMore ? items.slice(0, safeLimit) : items;
  const data = pageItems.map(transform);
  const nextCursor = hasMore
    ? buildNextCursor(pageItems[pageItems.length - 1], sortField)
    : null;

  return createPaginationEnvelope(data, {
    hasMore,
    nextCursor,
    total,
    limit: safeLimit,
  });
};

const paginateOffset = async ({
  model,
  filter = {},
  page = 1,
  limit = DEFAULT_LIMIT,
  sort = { _id: -1 },
  select,
  populate,
  lean = true,
  transform = (item) => item,
}) => {
  const safeLimit = clampLimit(limit);
  const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1;
  const skip = (safePage - 1) * safeLimit;

  const query = model.find(filter).sort(sort).skip(skip).limit(safeLimit);
  applyQueryOptions(query, { select, populate, lean });

  const [items, total] = await Promise.all([
    query.exec(),
    model.countDocuments(filter),
  ]);

  const data = items.map(transform);
  const hasMore = skip + items.length < total;

  return createPaginationEnvelope(data, {
    hasMore,
    nextCursor: hasMore ? String(safePage + 1) : null,
    total,
    limit: safeLimit,
  });
};

export {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  clampLimit,
  createPaginationEnvelope,
  paginateCursor,
  paginateOffset,
};
