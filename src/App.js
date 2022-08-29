import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  QueryClientProvider,
  QueryClient,
  useInfiniteQuery
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./styles.css";

const client = new QueryClient();

const itemTemplate = {
  login: "octocat",
  node_id: "MDQ6VXNlcjE=",
  avatar_url: "https://github.com/images/error/octocat_happy.gif",
  gravatar_id: "",
  url: "https://api.github.com/users/octocat",
  html_url: "https://github.com/octocat",
  followers_url: "https://api.github.com/users/octocat/followers",
  following_url: "https://api.github.com/users/octocat/following{/other_user}",
  gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
  starred_url: "https://api.github.com/users/octocat/starred{/owner}{/repo}",
  subscriptions_url: "https://api.github.com/users/octocat/subscriptions",
  organizations_url: "https://api.github.com/users/octocat/orgs",
  repos_url: "https://api.github.com/users/octocat/repos",
  events_url: "https://api.github.com/users/octocat/events{/privacy}",
  received_events_url: "https://api.github.com/users/octocat/received_events",
  type: "User",
  site_admin: false
};

let currentPage = 1;

function fetchList(page = 1) {
  const data = Array(100)
    .fill(null)
    .map((_, i) => ({
      ...itemTemplate,
      id: parseInt(`${page}${i}`, 10)
    }));

  return Promise.resolve(data);
}
const queryFn = async ({ pageParam = 0 }) => {
  const data = await fetchList(pageParam);

  data.forEach((item) => {
    client.setQueryData(["item", item.id], () => item);
  });

  return data;
};

const List = () => {
  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage
  } = useInfiniteQuery(["list"], {
    queryFn,
    getNextPageParam: (page) => {
      return currentPage++;
    }
  });

  const allRows = data ? data.pages.flatMap((d) => d.rows) : [];

  const parentRef = React.useRef();

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5
  });

  React.useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= allRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allRows.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems()
  ]);

  return (
    <div
      ref={parentRef}
      className="List"
      style={{
        height: `500px`,
        width: `100%`,
        overflow: "auto"
      }}
    >
      <ul
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative"
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index > allRows.length - 1;
          const post = allRows[virtualRow.index];

          return (
            <li
              key={virtualRow.index}
              className={virtualRow.index % 2 ? "ListItemOdd" : "ListItemEven"}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <pre>JSON.stringify(post)</pre>
              {isLoaderRow
                ? hasNextPage
                  ? "Loading more..."
                  : "Nothing more to load"
                : post}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <ReactQueryDevtools />
      {/* <div className="lds-circle">
        <div></div>
      </div> */}
      <List />
    </QueryClientProvider>
  );
}
