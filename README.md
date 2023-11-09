<p align="center" style="text-align: center">
  <a href="https://github.com/rakles/matrix-lock">
    <img alt="Matrix Lock Logo" src=".github/icon.png" width="128" height="128" />
  </a>
</p>

<h3 align="center">Matrix Lock</h3>
<p align="center">
    allows job sequencing within matrix workflows with controlled execution
</p>

<div align="center">

<a href="https://github.com/rakles/matrix-lock/blob/main/LICENSE">![MIT License](https://img.shields.io/github/license/rakles/matrix-lock)</a>

</div>

## About
Matrix Lock is a GitHub Action designed to control the execution order of jobs in GitHub Action workflows, especially when dealing with matrix builds that need to run certain jobs sequentially. It ensures that only one job proceeds at a time based on a predefined order, thus preventing race conditions and conflicts.

## How it Works
The action utilizes a lock file mechanism to manage workflow concurrency. It works in three main steps:

1. **Initialization (`init`):** Establishes the order in which jobs should execute.
2. **Waiting (`wait`):** Jobs check the lock file and wait for their turn to proceed.
3. **Continuation (`continue`):** A job moves itself to the next position, allowing the subsequent job to proceed.

## Inputs

- `step` (**required**): The operation that the action should perform. Valid values are `init`, `wait`, and `continue`.
- `order`: Specifies the order for the whole process. Required for the `init` step.
- `id`: The unique identifier for each job. Required for `wait` and `continue` steps.
- `retry-count`: The number of attempts a job should make to acquire the lock before failing. Default is 6.
- `retry-delay`: The time (in seconds) between each retry attempt. Default is 10.

## Usage

### Workflow Configuration

To use the Matrix Lock action in your workflow, add a step that uses this action in your `.github/workflows` YAML file.

Here is an example snippet showing how to use this action in your workflow:

```yaml
jobs:
  my_matrix_job:
    strategy:
      matrix:
        include:
          - id: some-id-1
            name: "Job 1"
          - id: some-id-2
            name: "Job 2"
    steps:
    - name: "Checkout repository"
      uses: actions/checkout@v2

    - name: "Initialize matrix lock"
      if: matrix.id == some-id-1
      uses: rakles/matrix-lock@v1
      with:
        step: init
        order: "some-id-1,some-id-2"

    - name: "Wait for matrix lock"
      uses: rakles/matrix-lock@v1
      with:
        step: wait
        id: ${{ matrix.id }}

    # Your job steps go here

    - name: "Continue matrix lock"
      uses: rakles/matrix-lock@v1
      with:
        step: continue
        id: ${{ matrix.id }}
```

In this example:

- The first job (with `id: some-id-1`) initializes the lock.
- Each job waits for its turn based on the `id`.
- After a job completes its steps, it continues the lock to allow the next job to start.
