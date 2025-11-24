React Component Types
1.	[[Functional Component]]: JavaScript function that returns JSX >> (STATE: Yes)[via Hooks]: Building UI elements with state and side effects
2.	[[Class Component]]: ES6 class extending React.Component >> (STATE: Yes): Managing complex state and lifecycle methods ￼
3.	[[Presentational Component]]: Focuses on UI rendering >> (STATE:No): Displaying data based on props ￼
4.	[[Container Component]]: Manages state and logic >> (STATE: Yes): Handling data fetching and passing data to presentational components ￼
5.	[[Higher-Order Component (HOC)]]: Function that returns a new component: (STATE:N/A) Reusing component logic across multiple components ￼
6.	[[Fragment]]: Groups multiple elements without adding extra nodes to the DOM: (STATE:N/A) Avoiding unnecessary DOM elements
7.	[[Wrapper Component]]: Wraps other components to provide additional layout or styling: (STATE:N/A) Applying consistent theming or layout
8.	[[Render Props]]: Technique where a component’s child is a function that returns a React element: (STATE:N/A) Sharing code between components using a prop whose value is a function
9.	[[Smart Component]]: Handles logic and state >> (STATE: Yes): Managing data-driven components ￼
10.	[[Dumb Component]]: Purely presentational >> (STATE:No): Stateless UI components
11.	[[Compound Component]]: Multiple components sharing state >> (STATE: Yes): Building complex UI structures
12.	[[Controlled Component]]: Form elements controlled by React state >> (STATE: Yes): Form inputs with validation
13.	[[Uncontrolled Component]]: Form elements managing their own state >> (STATE:No): Simple form inputs
