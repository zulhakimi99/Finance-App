<script>
    import Footer from "../component/Footer.svelte";
    import Tabs from '../component/Tab.svelte';
    import Add from './Add.svelte';
    import Display from './Display.svelte'

    let items = ['Display' , 'Add'];
    let activeItem = 'Display';
    const tabChange = (e) => activeItem = e.detail;

    let expens = [
        {
            id: "dsvswewfsaassdvefqffq",
            title: "Kereta",
            description: "Beli Kereta",
            amount: 2000,
            label: "personal",
            complated: false
        },

        ];

    const handleAdd = (e) => {
        const expen = e.detail;
        expens = [expen, ...expens];
        console.log(expens);
    }
</script>

<main>
    <Tabs {activeItem} {items} on:tabChange={tabChange} />

    {#if activeItem === 'Display'}
   <Display bind:expens={expens} />
    {:else if activeItem === 'Add'}
    <Add on:add={handleAdd} />
    {/if}
</main>

<Footer />

<style>
	main{
    width: 100%;
    max-width: 1350px;
    margin: 40px auto;
  }
</style>