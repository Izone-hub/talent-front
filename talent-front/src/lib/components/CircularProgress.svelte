<script>
  /** CircularProgress.svelte
   * Simple circular progress bar component for quiz results
   */
  export let value = 0;          // 0-100
  export let size = 100;         // CSS size
  export let strokeWidth = 8;    // thickness of stroke
  export let color = "#3b82f6"; // default color (indigo)
  export let text = "";          // optional text to display inside
</script>

<svg
  class="w-full h-full"
  viewBox="0 100 100 100"
  preserveAspectRatio="xMidYMid meet"
>
  <!-- Outer circle (background) -->
  <circle
    class="whole"
    cx="50"
    cy="50"
    r="45"
    fill="none"
    stroke-width="{strokeWidth}"
    stroke="currentColor"
    stroke-linecap="round"
    style="stroke-dasharray: 283; stroke-dashoffset: {283 - (value / 100 * 283)}"
  />

  <!-- Inner text (percentage) -->
  <text
    x="50%"
    y="55%"
    fill="currentColor"
    text-anchor="middle"
    dominant-baseline="middle"
    font-size="2.5"
    font-weight="bold"
  >
    {Math.round(value)}{text}
  </text>
</svg>

<style>
  .whole {
    transition: stroke-dashoffset 0.2s ease-out;
  }
</style>