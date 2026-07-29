import { SiLeetcode, SiCodeforces, SiGeeksforgeeks, SiCodechef, SiHackerrank } from "react-icons/si";
import { FaCode } from "react-icons/fa";

export function getPlatformIcon(platformId: string, className = "w-4 h-4") {
  switch (platformId.toLowerCase()) {
    case 'leetcode':
      return <SiLeetcode className={`${className} text-[#FFA116]`} />;
    case 'codeforces':
      return <SiCodeforces className={`${className} text-[#1F8ACB]`} />;
    case 'geeksforgeeks':
      return <SiGeeksforgeeks className={`${className} text-[#2F8D46]`} />;
    case 'codechef':
      return <SiCodechef className={`${className} text-[#5B4638]`} />;
    case 'hackerrank':
      return <SiHackerrank className={`${className} text-[#00EA64]`} />;
    default:
      return <FaCode className={`${className} text-muted-foreground`} />;
  }
}
