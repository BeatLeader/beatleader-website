<script>
  export let votes = {
    positive: 0,
    neutral: 0,
    negative: 0
  };

  const calculateAverage = () => {
    const { positive, neutral, negative } = votes;
    return (positive + (0.5 * neutral)) / (positive + (0.5 * neutral) + negative);
  };
</script>

<div>
  <span style="color: green;"><i class="fas fa-thumbs-up" />{votes.positive}</span>
  <span><i class="fas fa-minus" />{votes.neutral}</span>
  <span style="color: red;"><i class="fas fa-thumbs-down" />{votes.negative}</span>
  <span>{`${(calculateAverage() * 100).toFixed(0)}%`}</span>
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

  i {
    margin-right: 0.2em;
  }

</style>