"use client";

import { ReactNode, Suspense, ComponentType } from "react";

/**
 * A higher-order component that wraps a component with Suspense
 * to enable progressive loading with a fallback UI.
 */
export function withSuspense<T extends object>(
  Component: ComponentType<T>,
  Fallback: ComponentType<unknown> | ReactNode,
) {
  return function WithSuspenseWrapper(props: T) {
    return (
      <Suspense
        fallback={typeof Fallback === "function" ? <Fallback /> : Fallback}
      >
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Creates a standard interface for async data fetching components
 * with consistent prop naming and structure.
 */
export interface AsyncComponentProps<T> {
  data: T;
}

/**
 * Type for components that take sprintIds as a prop
 */
export interface SprintComponentProps {
  sprintIds: string[];
}

/**
 * Type for components that take both sprintIds and engineerId as props
 */
export interface EngineerComponentProps extends SprintComponentProps {
  engineerId: number;
}

/**
 * Type for components that require roleId
 */
export interface RoleComponentProps {
  roleId: string;
}
