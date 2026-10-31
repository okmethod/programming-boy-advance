import { navigateTo } from "$lib/presentation/utils/navigation";
import { GITHUB_REPO_URL } from "$lib/presentation/utils/constants";

interface Content {
  title: string;
  action: "navigate" | "redirect";
  route: string;
}

export interface ContentButtonProps {
  title: string;
  onClick: () => void;
}

const contents: Content[] = [
  {
    title: "Stage Select",
    action: "navigate",
    route: "/stage-select",
  },
  {
    title: "Automaton Sandbox",
    action: "navigate",
    route: "/sandbox",
  },
  {
    title: "Github Repository",
    action: "redirect",
    route: GITHUB_REPO_URL,
  },
];

export async function load() {
  const propsArray: ContentButtonProps[] = contents.map((content) => ({
    title: content.title,
    onClick: _getOnClick(content.action, content.route),
  }));

  function _getOnClick(action: string, route: string): () => void {
    const actions: { [key: string]: () => void } = {
      navigate: () => navigateTo(route),
      redirect: () => window.open(route, "_blank"),
    };
    return actions[action] || (() => {});
  }

  return { propsArray };
}
