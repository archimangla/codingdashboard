export interface PlatformMeta {
  id: string;
  name: string;
  slug: string;
  color: string;
  logoUrl: string;
  usernameLabel: string;
  profileUrlPattern?: string;
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "leetcode",
    name: "LeetCode",
    slug: "leetcode",
    color: "#FFA116",
    logoUrl: "https://leetcode.com/favicon.ico",
    usernameLabel: "Username",
    profileUrlPattern: "https://leetcode.com/{handle}",
  },
  {
    id: "codeforces",
    name: "Codeforces",
    slug: "codeforces",
    color: "#1F8ACB",
    logoUrl: "https://codeforces.org/favicon.ico",
    usernameLabel: "Username",
    profileUrlPattern: "https://codeforces.com/profile/{handle}",
  },
  {
    id: "codechef",
    name: "CodeChef",
    slug: "codechef",
    color: "#5B4638",
    logoUrl: "https://www.codechef.com/favicon.ico",
    usernameLabel: "Username",
    profileUrlPattern: "https://www.codechef.com/users/{handle}",
  },
  {
    id: "atcoder",
    name: "AtCoder",
    slug: "atcoder",
    color: "#006E54",
    logoUrl: "https://atcoder.jp/favicon.ico",
    usernameLabel: "Username",
    profileUrlPattern: "https://atcoder.jp/users/{handle}",
  },
  {
    id: "geeksforgeeks",
    name: "GeeksforGeeks",
    slug: "geeksforgeeks",
    color: "#2F8D46",
    logoUrl: "https://www.geeksforgeeks.org/favicon.ico",
    usernameLabel: "Username",
    profileUrlPattern: "https://www.geeksforgeeks.org/user/{handle}",
  },
  {
    id: "hackerrank",
    name: "HackerRank",
    slug: "hackerrank",
    color: "#00EA64",
    logoUrl: "https://www.hackerrank.com/favicon.ico",
    usernameLabel: "Username",
    profileUrlPattern: "https://www.hackerrank.com/profile/{handle}",
  },
  {
    id: "hackerearth",
    name: "HackerEarth",
    slug: "hackerearth",
    color: "#2C3454",
    logoUrl: "https://www.hackerearth.com/favicon.ico",
    usernameLabel: "Username",
    profileUrlPattern: "https://www.hackerearth.com/@{handle}",
  },
  {
    id: "cses",
    name: "CSES",
    slug: "cses",
    color: "#4B6FCC",
    logoUrl: "https://cses.fi/favicon.ico",
    usernameLabel: "Username",
    profileUrlPattern: "https://cses.fi/user/{handle}",
  },
  {
    id: "interviewbit",
    name: "InterviewBit",
    slug: "interviewbit",
    color: "#0081EF",
    logoUrl: "https://www.interviewbit.com/favicon.ico",
    usernameLabel: "Username",
    profileUrlPattern: "https://www.interviewbit.com/profile/{handle}",
  },
  {
    id: "spoj",
    name: "SPOJ",
    slug: "spoj",
    color: "#8B0000",
    logoUrl: "https://www.spoj.com/favicon.ico",
    usernameLabel: "Username",
    profileUrlPattern: "https://www.spoj.com/users/{handle}",
  },
  {
    id: "topcoder",
    name: "TopCoder",
    slug: "topcoder",
    color: "#29A8E0",
    logoUrl: "https://www.topcoder.com/favicon.ico",
    usernameLabel: "Username",
    profileUrlPattern: "https://www.topcoder.com/members/{handle}",
  },
  {
    id: "codingninjas",
    name: "Coding Ninjas",
    slug: "codingninjas",
    color: "#DD6620",
    logoUrl: "https://www.naukri.com/code360/favicon.ico",
    usernameLabel: "Username",
    profileUrlPattern: "https://www.naukri.com/code360/profile/{handle}",
  },
];

export const PLATFORM_MAP = new Map(PLATFORMS.map((p) => [p.id, p]));
