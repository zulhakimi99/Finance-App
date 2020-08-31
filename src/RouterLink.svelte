<script>
    import { curRoute } from './router.js';
    export let page = {
        path: '/',
        name: 'Home',
        path: '/about',
        name: 'About',
    }
    function redirecTo(event){
        curRoute.set(event.target.pathname);
        window.history.pushState({path: page.path}, '', window.location.origin + page.path);
    }
</script>
<style>
    a {
 float: left;
 color: #f2f2f2;
 text-align: center;
 padding: 14px 16px;
 text-decoration: none;
 font-size: 17px;
}

a:hover {
 background-color: #ddd;
 color: black;
}

</style>
<a href={page.path} on:click|preventDefault={redirecTo}>{page.name}</a>

