# Move Issues to Column
Moves issues' project cards to the column specified in the workflow. The issues are passed in either from workflow event triggers or manually.

## Workflow Template
This is an example of how to use this action. If the event trigger is not for an issue, you can still use this by passing in the optional `issues` argument to pass in multiple issues to parse.
```
name: Assigned Issues Are In Progress

on:
  issue:
    types: [assigned]

jobs:
  move-to-in-progress:
    runs-on: ubuntu-latest
    name: Move to In Progress Column
    steps:
      - name: Checkout
        uses: actions/checkout@v2
	  - name: Move to In Progress
	    uses: kin/gh-action-move-issue-to-column@1.0
		with:
		  access-token: "#{{ secrets.GITHUB_TOKEN }}"
		  project-name: "My Project"
		  target-column: "In Progress"
```

## Inputs
### Required
- `access-token`: Access token for repository. Use `"{{ secrets.GITHUB_TOKEN }}"` to prevent leaking secrets. This may require setting up a token with increased privileges. The token must have `repo` privileges.
- `project-name`: Case-insensitive string matching name of the existing project the target column is in
- `target-column`: Case-insensitive string matching the name of the existing column the cards should be moved to.

### Optional
- `issues`: A stringified array of Github [issue payloads](https://docs.github.com/en/free-pro-team@latest/rest/reference/issues#get-an-issue) formatted `[{ issue: { <webhook payload for issue } }, ...]`. Only needs to be used if the workflow event triggers are not of the `issue` type.

## Contribution
To cotnribute, please open an Issue on the action repo: https://github.com/kin/gh-action-autoarchive-issues-for-column to discuss bugs/modifications.
