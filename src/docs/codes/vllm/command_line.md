# VLLM Command Line Interface

vllm (学习版本为 0.8.4) 命令行分为四个模块，分别为 `chat`、`complete`、`serve`、`bench`，可通过 `vllm --help` 直接查看。

## 1. vllm chat / complete
该模块位于 `vllm/vllm/entrypoints/cli/openai.py`。
<a href="https://github.com/vllm-project/vllm/blob/main/vllm/entrypoints/cli/openai.py" target="_blank" rel="noreferrer">Code Addr</a>

- chat：有上下文管理，存在多轮会话。使用命令为 `vllm chat --url http://127.0.0.1:8000/v1`；
- complete：QA任务，没有上下文管理。使用命令为 `vllm complete --url http://127.0.0.1:8000/v1`。

::: code-group
```python [chat]
def _interactive_cli(args: argparse.Namespace) -> tuple[str, OpenAI]:
    _register_signal_handlers()

    base_url = args.url
    api_key = args.api_key or os.environ.get("OPENAI_API_KEY", "EMPTY")
    openai_client = OpenAI(api_key=api_key, base_url=base_url)

    if args.model_name:
        model_name = args.model_name
    else:
        available_models = openai_client.models.list()
        model_name = available_models.data[0].id

    print(f"Using model: {model_name}")

    return model_name, openai_client

def _add_query_options(
        parser: FlexibleArgumentParser) -> FlexibleArgumentParser:
    parser.add_argument(
        "--url",
        type=str,
        default="http://localhost:8000/v1",
        help="url of the running OpenAI-Compatible RESTful API server")
    parser.add_argument(
        "--model-name",
        type=str,
        default=None,
        help=("The model name used in prompt completion, default to "
              "the first model in list models API call."))
    parser.add_argument(
        "--api-key",
        type=str,
        default=None,
        help=(
            "API key for OpenAI services. If provided, this api key "
            "will overwrite the api key obtained through environment variables."
        ))
    return parser


class ChatCommand(CLISubcommand):
    """The `chat` subcommand for the vLLM CLI. """

    def __init__(self):
        self.name = "chat"
        super().__init__()

    @staticmethod
    def cmd(args: argparse.Namespace) -> None:
        model_name, client = _interactive_cli(args)
        system_prompt = args.system_prompt
        conversation: list[ChatCompletionMessageParam] = []

        if system_prompt is not None:
            conversation.append({"role": "system", "content": system_prompt})

        if args.quick:
            conversation.append({"role": "user", "content": args.quick})

            chat_completion = client.chat.completions.create(
                model=model_name, messages=conversation)
            print(chat_completion.choices[0].message.content)
            return

        print("Please enter a message for the chat model:")
        while True:
            try:
                input_message = input("> ")
            except EOFError:
                return
            conversation.append({"role": "user", "content": input_message})

            chat_completion = client.chat.completions.create(
                model=model_name, messages=conversation)

            response_message = chat_completion.choices[0].message
            output = response_message.content

            conversation.append(response_message)  # type: ignore
            print(output)

    def subparser_init(
            self,
            subparsers: argparse._SubParsersAction) -> FlexibleArgumentParser:
        chat_parser = subparsers.add_parser(
            "chat",
            help="Generate chat completions via the running API server.",
            description="Generate chat completions via the running API server.",
            usage="vllm chat [options]")
        _add_query_options(chat_parser)
        chat_parser.add_argument(
            "--system-prompt",
            type=str,
            default=None,
            help=("The system prompt to be added to the chat template, "
                  "used for models that support system prompts."))
        chat_parser.add_argument("-q",
                                 "--quick",
                                 type=str,
                                 metavar="MESSAGE",
                                 help=("Send a single prompt as MESSAGE "
                                       "and print the response, then exit."))
        return chat_parser
```

```python [complete]
class CompleteCommand(CLISubcommand):
    """The `complete` subcommand for the vLLM CLI. """

    def __init__(self):
        self.name = "complete"
        super().__init__()

    @staticmethod
    def cmd(args: argparse.Namespace) -> None:
        model_name, client = _interactive_cli(args)

        if args.quick:
            completion = client.completions.create(model=model_name, prompt=args.quick)
            print(completion.choices[0].text)
            return

        print("Please enter prompt to complete:")
        while True:
            input_prompt = input("> ")
            completion = client.completions.create(model=model_name, prompt=input_prompt)
            output = completion.choices[0].text
            print(output)

    def subparser_init(
            self,
            subparsers: argparse._SubParsersAction) -> FlexibleArgumentParser:
        complete_parser = subparsers.add_parser(
            "complete",
            help=("Generate text completions based on the given prompt "
                  "via the running API server."),
            description=("Generate text completions based on the given prompt "
                         "via the running API server."),
            usage="vllm complete [options]")
        _add_query_options(complete_parser)
        complete_parser.add_argument(
            "-q",
            "--quick",
            type=str,
            metavar="PROMPT",
            help=
            "Send a single prompt and print the completion output, then exit.")
        return complete_parser
```
:::

## 2. serve
该模块位于：`vllm/vllm/entrypoints/cli/serve.py`。
<a href="https://github.com/vllm-project/vllm/blob/main/vllm/entrypoints/cli/serve.py" target="_blank" rel="noreferrer">Code Addr</a>

```python
class ServeSubcommand(CLISubcommand):
    """The `serve` subcommand for the vLLM CLI. """

    def __init__(self):
        self.name = "serve"
        super().__init__()

    @staticmethod
    def cmd(args: argparse.Namespace) -> None:
        # If model is specified in CLI (as positional arg), it takes precedence
        if hasattr(args, 'model_tag') and args.model_tag is not None:
            args.model = args.model_tag

        if args.headless:
            run_headless(args)
        else:
            uvloop.run(run_server(args))

    def validate(self, args: argparse.Namespace) -> None:
        validate_parsed_serve_args(args)

    def subparser_init(
            self,
            subparsers: argparse._SubParsersAction) -> FlexibleArgumentParser:
        serve_parser = subparsers.add_parser(
            "serve",
            help="Start the vLLM OpenAI Compatible API server.",
            description="Start the vLLM OpenAI Compatible API server.",
            usage="vllm serve [model_tag] [options]")
        serve_parser.add_argument("model_tag",
                                  type=str,
                                  nargs='?',
                                  help="The model tag to serve "
                                  "(optional if specified in config)")
        serve_parser.add_argument(
            "--headless",
            action='store_true',
            default=False,
            help="Run in headless mode. See multi-node data parallel "
            "documentation for more details.")
        serve_parser.add_argument(
            '--data-parallel-start-rank',
            '-dpr',
            type=int,
            default=0,
            help='Starting data parallel rank for secondary nodes.')
        serve_parser.add_argument(
            "--config",
            type=str,
            default='',
            required=False,
            help="Read CLI options from a config file."
            "Must be a YAML with the following options:"
            "https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html#cli-reference"
        )

        serve_parser = make_arg_parser(serve_parser)
        show_filtered_argument_or_group_from_help(serve_parser)
        serve_parser.epilog = VLLM_SERVE_PARSER_EPILOG
        return serve_parser
```