<script>
	import { dateFromUnix, formatDateRelativeShort } from "../../utils/date";

  export let comments = {
    count: 15,
    lastDate: 1693445979,
  };
</script>

<div>
  <span><i class="fas fa-message" />{comments.count}</span>
  <span class="date">{`${formatDateRelativeShort(dateFromUnix(comments.lastDate))} ago`}</span>
</div>

<style>
  div {
    display: flex;
    height: 24px;
    border-radius: 6px;
    padding-left: 0.1em;
    padding-right: 0.4em;
    line-height: 170%;
    gap: 0.4em;
  }

  span {
    color: #e9e9e9;
  }

  .date {
    color: #bebebe;
    font-size: 12px;
  }

  i {
    margin-right: 0.2em;
  }

</style>