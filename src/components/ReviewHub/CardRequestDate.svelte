<script>
	import { dateFromUnix, formatDateRelativeShort } from "../../utils/date";

  export let requestDate = 1693445979;
</script>

<div>
  <span class="date">{`${formatDateRelativeShort(dateFromUnix(requestDate))} old`}</span>
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

  .date {
    color: #bebebe;
    font-size: 12px;
  }

  span {
    color: #e9e9e9;
  }

</style>