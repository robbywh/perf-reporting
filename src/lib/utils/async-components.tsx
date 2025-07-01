"use server";

import { Suspense } from "react";

/**
 * Types for sprint-based components
 */
export interface SprintProps {
  sprintIds: string[];
}

/**
 * Types for engineer-specific components
 */
export interface EngineerProps extends SprintProps {
  engineerId: number;
}

/**
 * Higher-order component to wrap an async component with a Suspense boundary
 * This eliminates the duplicated patterns across pages
 */
export function withSuspense<P extends object>(
  AsyncComponent: React.ComponentType<P>,
  Fallback: React.ReactNode
) {
  return function SuspenseWrappedComponent(props: P) {
    return (
      <Suspense fallback={Fallback}>
        <AsyncComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Creates a factory function to generate async components with consistent props
 * This eliminates the repetitive async function definitions
 */
export function createAsyncComponentFactory<DataType, PropType>(
  fetchData: (props: PropType) => Promise<DataType>,
  Component: React.ComponentType<{ data: DataType }>
) {
  return async function AsyncComponent(props: PropType) {
    const data = await fetchData(props);
    return <Component data={data} />;
  };
}
