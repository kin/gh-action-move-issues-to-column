const core = require("@actions/core");
const github = require("@actions/github");
const { graphql } = require("@octokit/graphql");

try {
  const accessToken = core.getInput("access-token");
  const payload = core.getInput("issues");
  const issues = Array.isArray(payload) ? payload : [payload];
  const repoUrl = issues[0].repository_url;
  const splitUrl = repoUrl.split('/');
  const repoOwner = splitUrl[4];
  const repo = splitUrl[5];
  const project = core.getInput("project-name");
  const columnName = core.getInput("target-column");

  // get column id for target from inputs
  const columnIdQuery = `query columns($owner: String!, $name: String!, $projectName: String!) {
    repository(owner: $owner, name: $name) {
      projects(search: $projectName, last: 1) {
	edges {
	  node {
	    columns(first: 20) {
	      edges {
		node {
		  id
		  name
		}
	      }
	    }
	  }
	}
      }
    }
  }`;


  async function getColumnIds(owner, repo, projectName) {
    return graphql(columnIdQuery, {
      owner: owner,
      name: repo,
      projectName: projectName,
      headers: {
	authorization: `bearer ${accessToken}`,
      }
    });
  };

  // Get project card id for each issue
  const cardIdsForIssue = `query issues($issueId: ID!) {
    node(id: $issueId) {
      ... on Issue {
	projectCards(first: 5) {
	  edges {
	    node {
	      id
	    }
	  }
	}
      }
    }
  }`;

  async function getCardsForIssue(issueId) {
    return graphql(cardIdsForIssue, {
      issueId: issueId,
      headers: {
	authorization: `bearer ${accessToken}`,
      }
    });
  }

  // update each project card to column
  const updateCardColumnMutation = `mutation updateProjectCard($cardId: String!, $columnId: String!) {
    moveProjectCard(input:{cardId: $cardId, columnId: $columnId}) {
      clientMutationId
    }
  }`;

  async function moveCardToColumn(cardId, columnId) {
    return graphql(updateCardColumnMutation, {
      cardId: cardId,
      columnId: columnId,
      header: {
	authorization: `bearer ${accessToken}`
      }
    });
  }

  // create run function and run it
  const run = async () => {
    try {
      // Find target column id
      const { repository: { projects: { edges: projectEdges } } }= await getColumnIds('kin', 'dot-com', project);
      const columns = projectEdges.flatMap(p => p.node.columns.edges).map(c => c.node);
      const targetColumn = columns.find(c => c.name.toLowerCase() == columnName.toLowerCase());

      // Find card ids for issues
      const issueIds = issues.map(i => i.node_id);
      const cardPromises = await Promise.all(issueIds.map(getCardsForIssue));
      const cardIds = cardPromises.flatMap(c => c.node.projectCards.edges.flatMap(e => e.node.id));

      // Update cards only if the column exists
      if (typeof targetColumn === undefined) {
	core.setFailed("Target column does not exist on project. Please use a different column name");
      } else {
	const targetColumnId = targetColumn.id;
	cardIds.forEach(cardId => moveCardToColumn(cardId, targetColumnId));
      };
    }
    catch (error) {
      core.setFailed(error.message);
    }
  };
}
catch (error) {
  core.setFailed(error.message);
}
