import groovy.json.*

json = new JsonSlurper().parse(new FileReader(new File("/Users/davejmartin2/Desktop/SpeciesGroups.txt")))

outputDir = new File("/data/multigroupImages")

json.each { group ->  group.taxa.each { 

facetName = group.facetName
if(group.facetName == "order") facetName = "bioOrder"
//fq=rank:species
urlString = "http://bie.ala.org.au/search.json?fq=idxtype:TAXON&results=10&fq=hasImage:true&fq=australian_s:recorded&fq=" +facetName +":" + it.name
println(urlString)
u = new URL(urlString) 		
searchJSON = (new JsonSlurper()).parseText(u.getText())
println(group.facetName +":" + it.name + " >> " + searchJSON?.searchResults?.results[0]?.thumbnailUrl)		
  if(searchJSON?.searchResults?.results[0]?.thumbnailUrl != null){
     def file = new FileOutputStream("/data/multigroupImages/"+it.name.toLowerCase()+".jpg")
     def out = new BufferedOutputStream(file)
     out << new URL(searchJSON?.searchResults?.results[0]?.thumbnailUrl).openStream()
     out.close()
     
     def file2 = new FileOutputStream("/data/multigroupImages/"+it.name.toLowerCase()+"_large.jpg")
     def out2 = new BufferedOutputStream(file2)
     out2 << new URL(searchJSON?.searchResults?.results[0]?.smallImageUrl).openStream()
     out2.close()     
  }
}}
