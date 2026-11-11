import { memo, type ReactNode } from "react";
import { TabButton, type TabButtonBaseProps } from "./internal/TabButton";
import {
  TabsProvider,
  useTabsShellController,
  type TabsShellProps,
} from "./internal/TabsShell";
import type { TabValue } from "./internal/liquidGlassStore";
import { DEFAULT_STYLE } from "./internal/types";

type TabsProps<T extends string | number = string | number> = TabsShellProps<T>;

type TabProps = TabButtonBaseProps;

function TabsInner<T extends TabValue>({
  value,
  onChange,
  layoutId,
  orientation = "horizontal",
  children,
  variant = "capsule",
  roundedClass,
  className = "",
  highlightClassName = "navbar-highlight-flat",
  highlightStyle = DEFAULT_STYLE,
  style,
  role = "tablist",
  ...rest
}: Readonly<TabsProps<T>>) {
  const shell = useTabsShellController({
    value,
    layoutId,
    orientation,
  });

  return (
    <TabsProvider
      shell={shell}
      onChange={onChange as ((val: TabValue) => void) | undefined}
      layoutId={layoutId}
      orientation={orientation}
      variant={variant}
      roundedClass={roundedClass}
      className={className}
      highlightClassName={highlightClassName}
      highlightStyle={highlightStyle}
      style={style}
      role={role}
      htmlProps={rest}
    >
      {children}
    </TabsProvider>
  );
}

interface TabsComponent {
  <T extends string | number>(props: Readonly<TabsProps<T>>): ReactNode;
  displayName?: string;
}

const Tabs: TabsComponent = memo(TabsInner) as TabsComponent;
Tabs.displayName = "Tabs";

function TabComponent(props: Readonly<TabProps>) {
  return <TabButton {...props} />;
}

const Tab = memo(TabComponent);
Tab.displayName = "Tab";

export { Tabs, Tab };
