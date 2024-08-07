import { connectToServer } from "@finos/vuu-data-remote";
import type { LayoutChangeHandler } from "@finos/vuu-layout";
import {
  DraggableLayout,
  LayoutProvider,
  LayoutProviderProps,
  StackLayout,
} from "@finos/vuu-layout";
import {
  ContextMenuProvider,
  DialogProvider,
  NotificationsProvider,
} from "@finos/vuu-popups";
import {
  LayoutJSON,
  VuuUser,
  logger,
  registerComponent,
} from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  HTMLAttributes,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppHeader } from "./app-header";
import { ApplicationProvider } from "./application-provider";
import {
  LayoutManagementProvider,
  useLayoutContextMenuItems,
  useLayoutManager,
} from "./layout-management";
import {
  IPersistenceManager,
  LocalPersistenceManager,
  PersistenceProvider,
  usePersistenceManager,
} from "./persistence-manager";
import { SidePanelProps, useShellLayout } from "./shell-layouts";
import { UserSettingsPanel } from "./user-settings";

import shellCss from "./shell.css";
import { loadingApplicationJson } from "./layout-management/defaultApplicationJson";

registerComponent("ApplicationSettings", UserSettingsPanel, "view");

if (process.env.NODE_ENV === "production") {
  // StackLayout is loaded just to force component registration, we know it will be
  // required when default layout is instantiated. This is only required in prod
  // to avoif tree shaking the Stack away. Causes a runtime issue in dev.
  if (typeof StackLayout !== "function") {
    console.warn(
      "StackLayout module not loaded, will be unsbale to deserialize from layout JSON"
    );
  }
}

const { error } = logger("Shell");

const defaultLeftSidePanel: ShellProps["LeftSidePanelProps"] = {};

export type LayoutTemplateName = "full-height" | "inlay";

export interface ShellProps extends HTMLAttributes<HTMLDivElement> {
  LayoutProps?: Pick<
    LayoutProviderProps,
    "createNewChild" | "pathToDropTarget"
  >;
  LeftSidePanelProps?: SidePanelProps;
  children?: ReactNode;
  defaultLayout?: LayoutJSON;
  leftSidePanelLayout?: "full-height" | "inlay";
  loginUrl?: string;
  // paletteConfig: any;
  saveUrl?: string;
  serverUrl?: string;
  user: VuuUser;
}

const VuuApplication = ({
  LayoutProps,
  LeftSidePanelProps = defaultLeftSidePanel,
  children,
  className: classNameProp,
  leftSidePanelLayout,
  loginUrl,
  saveUrl,
  serverUrl,
  user,
  ...htmlAttributes
}: ShellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-shell",
    css: shellCss,
    window: targetWindow,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const { applicationJson, saveApplicationLayout } = useLayoutManager();
  const { buildMenuOptions, handleMenuAction } = useLayoutContextMenuItems();
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "rejected"
  >("connected");

  const handleLayoutChange = useCallback<LayoutChangeHandler>(
    (layout) => {
      try {
        saveApplicationLayout(layout);
      } catch {
        error?.("Failed to save layout");
      }
    },
    [saveApplicationLayout]
  );

  useMemo(async () => {
    if (serverUrl && user.token) {
      const connectionStatus = await connectToServer({
        authToken: user.token,
        url: serverUrl,
        username: user.username,
      });
      setConnectionStatus(connectionStatus);
    }
  }, [serverUrl, user.token, user.username]);

  const className = cx("vuuShell");

  const isLayoutLoading = applicationJson === loadingApplicationJson;

  const shellLayout = useShellLayout({
    LeftSidePanelProps,
    leftSidePanelLayout,
    appHeader: <AppHeader loginUrl={loginUrl} />,
  });

  if (connectionStatus === "rejected") {
    console.log("game over, no connection to server");
  }

  return isLayoutLoading ? null : (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildMenuOptions}
    >
      <LayoutProvider
        {...LayoutProps}
        layout={applicationJson.layout}
        onLayoutChange={handleLayoutChange}
      >
        <DraggableLayout
          className={className}
          ref={rootRef}
          {...htmlAttributes}
        >
          {shellLayout}
        </DraggableLayout>
      </LayoutProvider>
      {children}
    </ContextMenuProvider>
  );
};

export const Shell = ({ defaultLayout, user, ...props }: ShellProps) => {
  // If user has provided an implementation of IPersistenceManager
  // by wrapping higher level PersistenceProvider, use it, otw
  // default to LocalPersistenceManager
  const persistenceManager = usePersistenceManager();
  const localPersistenceManager = useMemo<
    IPersistenceManager | undefined
  >(() => {
    if (persistenceManager) {
      return undefined;
    }
    console.log(
      `No Persistence Manager is configured, configuration data will be persisted to Local Storage, under the key 'vuu/${user.username}'`
    );
    return new LocalPersistenceManager(`vuu/${user.username}`);
  }, [persistenceManager, user.username]);

  // ApplicationProvider must go outside Dialog and Notification providers
  // ApplicationProvider injects the SaltProvider and this must be the root
  // SaltProvider.

  const shellProviders = (
    <ApplicationProvider density="high" theme="vuu-theme" user={user}>
      <LayoutManagementProvider defaultLayout={defaultLayout}>
        <DialogProvider>
          <NotificationsProvider>
            <VuuApplication {...props} user={user} />
          </NotificationsProvider>
        </DialogProvider>
      </LayoutManagementProvider>
    </ApplicationProvider>
  );

  if (persistenceManager) {
    return shellProviders;
  } else {
    return (
      <PersistenceProvider persistenceManager={localPersistenceManager}>
        {shellProviders}
      </PersistenceProvider>
    );
  }
};
