## 背景

./ghostコマンドを用いたissueベースで仕事を進めていく

issueは下記の属性を持つ

- title: 人間が分かりやすいように簡潔かつ明瞭な1文を記す
- description:
    - WHY, WHATを記述。HOWは書かない
    - WHY: このissueを解くべき理由を簡潔に記す
    - WHAT: 解き方を方針レベルで書いておく。(HOWまで書きすぎると柔軟性が損なわれるのであくまでWHATレベルまで)
    - RELATED: 関連issue, このissueが解決しないと解けない問題、
    - 自分以外の人がこの問題に取り組んでも問題ないように、背景知識をdescriptionにかく。
- status
    - plan: 内容を精緻化する前
    - backlog: 進行可能なissue。ただし、依存が解消されていない可能性あり
    - in progress: 進行中
    - in review: レビュー中のもの
    - done: 完了したタスク

### ghostコマンドの基本的な使い方

  1. 利用可能なタスクの確認

  ./ghost issue available  # 作業可能なissue一覧
  ./ghost list            # 全issue一覧
  ./ghost issue show <id> # 特定issueの詳細

  2. issue作成と管理

  # 新規issue作成
  ./ghost create "タイトル" --description "詳細" --parent <parentId>

  # ステータス更新
  ./ghost issue update <id> --status in_progress  # 作業開始
  ./ghost issue update <id> --status in_review # レビュー中

  重要なルール

  - タスクはissueとして管理
  - ステータス遷移: plan → backlog → in_progress → done(doneは基本的に人間が移す)
  - 作業状況は常に更新する

## 概要

issueの番号やタイトルが与えられるので`./ghost list`や`./ghost show <issueId>`で内容を確認し理解する。
必要に応じて`./ghost create`で新しいissueを作成する。

その後、以下のステップでイシューの解決方法を策定し`ghost update`で追記して置く

## イシューの精緻化

- 解き方はまだ練っていないが、大きな問題をどう分割統治して解いていくか決める
- 分割が必要ないくらいのissueであればそのままの粒度
- 解くべき理由、見込んでいる効果を明確にする
- その後、解き方を方針レベルで書いておく(HOWまで書きすぎると柔軟性が損なわれるのであくまでWHATレベルまで)
- 自分以外の人がこの問題に取り組んでも問題ないように、背景知識をdescriptionにかく。
- この手順によって進行可能になるはずなので`ghost update <issueId> --status backlog`でステータスを更新する
- 必要に応じて、`./ghost create --parent <issueId>`で子issueを作成する(タイトルやdescriptionも埋めること)
