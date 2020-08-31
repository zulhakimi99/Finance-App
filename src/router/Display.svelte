<script>
import Modal from "../component/Modal.svelte";




export let expens = [];

let currentFilter = 'all';

let expen = {
        title: '',
        description: '',
        amount: '',
        label: '',
    }


let update

function updatecomplate(index){
    console.log(index)
    update.show()
    var userExpen = expens[index];
    console.log( { userExpen })
    expen = userExpen;
    
}

function deleteexpens(index){
    var target = expens[index].id;
    deleteExpen(target)
}




$: totalExpenses = () =>{
    let total = 0 
    for (let index = 0; index < expens.length; index++) {
        const element = expens[index];
        total += element.amount
    }
    return total
}


$: expens = currentFilter === 'all'
    ? expens
    : currentFilter === 'selected'
        ? expens.filter(expenses => expenses.select )
        : expens.filter(expenses => !expenses.select);

const deleteExpen  = id =>{
    console.log(id);
    expens = expens.filter(expenses => expenses.id !== id);
}


const deleteAll = () =>{
    expens = expens.filter(expenses => !expenses);
}

function clearCompleted() { 
    expens = expens.filter(expenses => !expenses.select);
}

const updateExpenses = () => {
    let updatedExpenses = {
        title: expen.title,
        description: expen.description,
        amount: expen.amount,
        label:expen.lebel
    };
    const expenIndex = expens.findIndex(p => p.id === expen.id);
    expens[expenIndex] = updatedExpenses;
}
const onSubmitHandler = () => {
    updateExpenses();

}
    


</script>

<div class="display-total">
    Your Total Expenses :  RM{ totalExpenses()}  
    <button class="btn danger" on:click={() => deleteAll()}> Reset </button>
</div>


        <div class="display">
            {#if expens != null}
                
            {#each expens as expenses ,i }
            <div class="detail">
                 <h3>
                <strong>Title : {expenses.title}</strong>
                </h3>
                <span>Description : {expenses.description}</span><br>
                <label class="container">
                    <input type="checkbox" bind:checked={expenses.select}>
                    <span class="checkmark"></span>
                </label>
                <span>Amount :  {expenses.amount} </span><br>
                <span>Label :  {expenses.label} </span><br><br>
                <button class="btn update" on:click={() => updatecomplate(i)}> Update </button>
                <button class="btn danger" on:click={() => deleteexpens(i)}> Delete </button>
            </div>
            {:else}
            No Expenses...
            {/each}
            {/if}
        </div>
        
        <button class="btn danger" on:click={clearCompleted}> Clear Selected </button>
      

        <Modal bind:this={update}>      
<form on:submit|preventDefault={onSubmitHandler}>
    <div class="form-group">
        <div class="row">
            <div class="col-25">
        <label for="title"> Title :</label>
            </div>
            <div class="col-75">
        <input
        bind:value={expen.title}
        type="text"
        class="form-control"
        id="detail"
        placeholder="Title" />
    </div>
    </div>
    </div>
    <div class="form-group">
    <div class="row">
        <div class="col-25">
        <label for="description"> Description :</label>
        </div>
        <div class="col-75">
        <input
        bind:value={expen.description}
        type="text"
        class="form-control"
        id="detail"
        placeholder="Description" />
    </div>
    </div>
    </div>

    <div class="form-group">
        <div class="row">
            <div class="col-25">
        <label for="amount"> Amount :</label>
        </div>
        <div class="col-75">
        <input
        bind:value={expen.amount}
        type="number"
        class="form-control"
        id="detail"
        placeholder="amount" />
        </div>
    </div>
    </div>

    <div class="form-group">
        <div class="row">
            <div class="col-25">
        <label for="label"> Label :</label>
            </div>
            <div class="col-75">
        <select
        bind:value={expen.label}
        class="form-control"
        id="label">
        <option selected disabled>Select a Label</option>
        <option value="groceries">Groceries</option>
        <option value="bills">Bills</option>
        <option value="utilities">Utilities</option>
        <option value="personal">Personal</option>
        </select>
        </div>
    </div>
    </div>
    <div class="row">
        <center>
    <button type="submit" class="btn submit1">Submit Now</button>
</center>
    </div>
</form>
        </Modal> 

<style>
    .display{
        display: grid;
        padding: 20px;
        margin: 0px;
        grid-template-columns: 1fr 1fr;
        grid-gap: 20px;
        background: #fff;
        border-radius: 6px;
        box-shadow: 0px 2px 4px rgb(0,0,0,0.1);
    }

    .detail{
        background: #fff;
        padding: 20px;
        border-radius: 6px;
        box-shadow: 0px 2px 4px rgb(0,0,0,0.1);
    }

   span{ 
       display: inline-block;
       padding: 10px 20px;
   }

    .display-total{
        display: grid;
        grid-template-columns: 1;
        text-align: center;
        font-size: 20px;
        border-radius: 10px;
        background-color: rgb(184, 184, 184);
        padding: 20px;
    }

    .btn {
        border: none;
        color: white;
        padding: 7px 14px;
        margin: 20px;
        font-size: 16px;
        cursor: pointer;
        
    }

   
    .danger {
        background-color: #f44336;
        float: right;
        border-radius: 6px;
        width: 20%;
        } /* Red */ 
    .danger:hover {background: #da190b;}
    
   

    .update {
        background-color: #2196F3;
        float: center;
        border-radius: 6px;
    } /* Blue */
    .update:hover {background: #0b7dda;}

  /* The container */
.container {
  display: block;
  float: right;
  position: relative;
  padding-left: 35px;
  margin-bottom: 12px;
  cursor: pointer;
  font-size: 22px;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Hide the browser's default checkbox */
.container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

/* Create a custom checkbox */
.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 25px;
  width: 25px;
  background-color: #eee;
}

/* On mouse-over, add a grey background color */
.container:hover input ~ .checkmark {
  background-color: #ccc;
}

/* When the checkbox is checked, add a blue background */
.container input:checked ~ .checkmark {
  background-color: #2196F3;
}

/* Create the checkmark/indicator (hidden when not checked) */
.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

/* Show the checkmark when checked */
.container input:checked ~ .checkmark:after {
  display: block;
}

/* Style the checkmark/indicator */
.container .checkmark:after {
  left: 9px;
  top: 5px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 3px 3px 0;
  -webkit-transform: rotate(45deg);
  -ms-transform: rotate(45deg);
  transform: rotate(45deg);
}


input[type=text], select  {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}

input[type=number], select  {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}

label {
  padding: 12px 12px 12px 0;
  display: inline-block;
}

    .submit1 {
        background-color: #4CAF50;
        border-radius: 6px;
    } /* Green */
    .submit1:hover {background-color: #46a049;}

    .btn {
        border: none;
        color: white;
        padding: 7px 14px;
        margin: 20px;
        font-size: 16px;
        cursor: pointer;
        
    }



.container {
  border-radius: 5px;
  background-color: #f2f2f2;
  padding: 20px;
}

.col-25 {
  float: left;
  width: 25%;
  margin-top: 6px;
}

.col-75 {
  float: left;
  width: 75%;
  margin-top: 6px;
}

/* Clear floats after the columns */
.row:after {
  content: "";
  display: table;
  clear: both;
}



</style>

